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
		if (!locks[lock.member.connectionId])
			locks[lock.member.connectionId] = {};
		if (lock.status == 'unlocked') {
			delete locks[lock.member.connectionId][obj.usermode];
			obj.usermode = UserMode.None;
		} else if (lock.status == 'locked') {
			obj.usermode = locations[lock.member.connectionId] && locations[lock.member.connectionId].path == lock.id ? UserMode.Drag : UserMode.Hover;
			obj.usercolor = members[lock.member.connectionId].profileData.color;
			locks[lock.member.connectionId][obj.usermode] = obj;
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
			delete locations[ms.connectionId];
			delete locks[ms.connectionId];
			cursors = cursors;
			members = members;
		});
		space.members.subscribe(['enter', 'updateProfile'], (ms) => {
			members[ms.connectionId] = ms;
			members = members;
		});
		space.locations.subscribe('update', (ms) => {
			if (locations[ms.member.connectionId])
				locations[ms.member.connectionId].usermode = UserMode.Hover;
			locations[ms.member.connectionId] = ms.currentLocation.path ? $game.render(ms.currentLocation.path) : null;
			if (locations[ms.member.connectionId]) {
				locations[ms.member.connectionId].usermode = UserMode.Drag;
				locations[ms.member.connectionId].usercolor = members[ms.member.connectionId].profileData.color;
			}
			$game = $game;
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

let gamecomp;

function onpointermove({clientX, clientY}) {
	if (entered)
		space.cursors.set({position: gamecomp.canvas({x: clientX, y: clientY})});
}

function ongameevent(e) {
	if (!space || !channel)
		return;
	let lock = space.locks.get(e.detail.path);
	if (lock && lock.member.connectionId != $ably.connection.id)
		e.preventDefault();
	else
		channel.publish(e.detail.action, e.detail);
}

async function onuievent(e) {
	if (!space)
		return;

	let lock;
	if (
		e.detail.hovered && (lock = space.locks.get(e.detail.hovered)) && lock.member.connectionId != $ably.connection.id
		|| e.detail.selected && (lock = space.locks.get(e.detail.selected)) && lock.member.connectionId != $ably.connection.id
	) {
		e.preventDefault();
		return;
	}

	space.locations.set({path: e.detail.selected});

	let tolock = e.detail;
	for (let lock of await space.locks.getSelf()) {
		if ((lock.id != tolock.hovered) && (lock.id != tolock.selected))
			space.locks.release(lock.id);
		else if (lock.id == tolock.hovered)
			delete tolock.hovered;
		else if (lock.id == tolock.selected)
			delete tolock.selected;
	}
	for (let lockid of Object.values(tolock))
		if (lockid)
			space.locks.acquire(lockid);
}

</script>

<svelte:head>
	<title>{$page.params.name} - {$page.params.play}</title>
</svelte:head>
<svelte:window on:pointermove|passive="{onpointermove}" on:pointerup|passive="{onpointerup}" />

<GameComp on:uievent="{onuievent}" on:gameevent="{ongameevent}" bind:this="{gamecomp}" {game} {user} />
{#each Object.values(cursors) as cursor(cursor.connectionId)}
	<div class="absolute pointer-events-none" style="left: {gamecomp.screen(cursor.position).x - 10}px; top: {gamecomp.screen(cursor.position).y - 10}px;">
		<div class="rounded-full border-solid border-2 inline-block" style="width: 21px; height: 21px; border-color: {members[cursor.connectionId].profileData.color}"></div>
		<span class="rounded-xl m-1 p-1" style="background-color: {members[cursor.connectionId].profileData.color}">{members[cursor.connectionId].profileData.name}</span>
	</div>
{/each}
