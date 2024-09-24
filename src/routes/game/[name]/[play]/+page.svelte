<script lang="ts">
import { page } from '$app/stores';
import { onMount, onDestroy, getContext } from 'svelte';
import { writable } from 'svelte/store';
import Game from "$lib/Game.js"
import GameComp from "$lib/Game.svelte"
import {UserMode} from "$lib/types.js";

export let data;
let games = getContext('games');
let channel;
if (!$games[$page.params.name])
	$games[$page.params.name] = {};
if (!$games[$page.params.name][$page.params.play]) {
	$games[$page.params.name][$page.params.play] = writable(new Game($page.params.play, data.gamedef));
}
let game = $games[$page.params.name][$page.params.play];
let ably = getContext('ably');
let spaces = getContext('spaces');
let user = getContext('user');
let space;
let entered = false;
let members = {};
let cursors = {};
let locations = {};
let locks = {};

function handle_lock(lock) {
	if (lock.member.connectionId != $ably.connection.id) {
		let obj = $game.render(lock.id);
		if (lock.status == 'unlocked') {
			obj.usermode = UserMode.None;
			delete locks[lock.member.connectionId];
		} else if (lock.status == 'locked') {
			obj.usermode = locations[lock.member.connectionId] && locations[lock.member.connectionId].path == lock.id ? UserMode.Drag : UserMode.Hover;
			obj.usercolor = members[lock.member.connectionId].profileData.color;
			locks[lock.member.connectionId] = obj;
		}
		$game = $game;
	}
}

function handle_message(msg) {
	if (msg.connectionId != $ably.connection.id) {
		let obj = msg.data.path ? $game.render(msg.data.path) : $game;
		let res = obj[msg.data.action](...(msg.data.args || []).map(p => p ? $game.render(p) : p));
		if (msg.data.pos)
			res.pos = msg.data.pos;
		$game = $game;
	}
}

ably.subscribe(async a => {
	if (a) {
		let key = 'games:' + $page.params.name + '_' + $page.params.play;
		channel = $ably.channels.get(key);
		await channel.attach();
		let history = await channel.history({'direction': 'forwards'});
		for (let msg of history.items)
			handle_message(msg);
		channel.subscribe(handle_message);

		space = await $spaces.get(key);
		await space.enter($user);
		user.subscribe(u => space.updateProfileData(u));
		members   = Object.fromEntries((await space.getState()).members.map(v => [v.connectionId, v]));
		locations = await space.locations.getOthers();
		cursors   = Object.fromEntries(Object.entries(await space.cursors.getAll()).filter(v => v[1] != undefined));
		(await space.locks.getOthers()).map(l => handle_lock(l));
		space.locks.subscribe(handle_lock);
		space.members.subscribe(['leave', 'remove'], (ms) => {
			delete cursors[ms.connectionId];
			delete members[ms.connectionId];
			cursors = cursors;
			members = members;
		});
		space.members.subscribe(['enter', 'updateProfile'], (ms) => {
			members[ms.connectionId] = ms;
			members = members;
		});
		space.locations.subscribe('update', (ms) => {
			locations[ms.member.connectionId] = ms.currentLocation;
			if (locks[ms.member.connectionId]) {
				locks[ms.member.connectionId].usermode = locks[ms.member.connectionId].path == ms.currentLocation.path ? UserMode.Drag : UserMode.Hover;
				$game = $game;
			}
		});
		entered = true;
		space.cursors.subscribe(async (update) => {
			cursors[update.connectionId] = update;
			cursors = cursors;
		});
	}
});

onDestroy(() => {
	if (entered)
		space.leave();
});

function onpointermove({clientX, clientY}) {
	if (entered)
		space.cursors.set({position: {x: clientX, y: clientY}});
}

function ongameevent(e) {
	if (channel)
		channel.publish(e.detail.action, e.detail);
}

let locked;
function onuievent(e) {
	if (!space)
		return;
	if (locked && e.detail.path != locked) {
		space.locks.release(locked);
		locked = undefined;
	}
	if (e.detail.path) {
		const lock = space.locks.get(e.detail.path);
		if (lock && lock.member.connectionId != $ably.connection.id)
			e.preventDefault();
		else if (!lock) {
			space.locks.acquire(e.detail.path);
			locked = e.detail.path;
		}
		if (e.detail.action == 'drag')
			space.locations.set({path: e.detail.path});
		else if (e.detail.action == 'drop')
			space.locations.set({path: undefined});
	}
}

</script>

<svelte:head>
	<title>{$page.params.name} - {$page.params.play}</title>
</svelte:head>
<svelte:window on:pointermove|passive="{onpointermove}" on:pointerup|passive="{onpointerup}" />

<GameComp on:uievent="{onuievent}" on:gameevent="{ongameevent}" {game} {user} />
{#each Object.values(cursors) as cursor(cursor.connectionId)}
	<div class="absolute pointer-events-none" style="left: {cursor.position.x - 10}px; top: {cursor.position.y - 10}px;">
		<div class="rounded-full border-solid border-2 inline-block" style="width: 21px; height: 21px; border-color: {members[cursor.connectionId].profileData.color}"></div>
		<span class="rounded-xl m-1 p-1" style="background-color: {members[cursor.connectionId].profileData.color}">{members[cursor.connectionId].profileData.name}</span>
	</div>
{/each}
