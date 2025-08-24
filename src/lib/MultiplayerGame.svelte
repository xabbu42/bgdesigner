<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { writable } from 'svelte/store';
import Game from "$lib/Game.js"
import GameComp from "$lib/Game.svelte"
import { type Lock } from "$lib/types.js";
import { user } from '$lib/stores.js';
import { ably } from '$lib/init_ably.js';
import Spaces, { type Space, type Lock as AblyLock, type SpaceMember, type CursorUpdate } from '@ably/spaces';
import Ably, { type RealtimeChannel, type InboundMessage } from 'ably';

export let ably_namespace = 'bgdesigner';
export let game:Game;

let channel:RealtimeChannel;
let space:Space;
let entered = false;
let members:Record<string, SpaceMember> = {};
let cursors:Record<string, CursorUpdate> = {};
let locations:Record<string, any> = {};
let locks:Record<string, Record<string, any>> = {};

function handle_lock(lock:AblyLock) {
	if (lock.member.connectionId != ably.connection.id) {
		let obj = game.render(lock.id);
		if (!locks[lock.member.connectionId])
			locks[lock.member.connectionId] = {};
		if (lock.status == 'unlocked') {
			delete locks[lock.member.connectionId][obj.lock];
			obj.lock = 'None';
		} else if (lock.status == 'locked') {
			obj.lock = 'Hover';
			obj.usercolor = members[lock.member.connectionId].profileData?.color;
			locks[lock.member.connectionId][obj.lock] = obj;
		}
		game = game;
	}
}

function handle_message(msg:InboundMessage) {
	if (msg.connectionId != ably.connection.id) {
		let obj = msg.data.path ? game.render(msg.data.path) : game;
		let res = obj[msg.data.action](...(msg.data.args || []).map((p:string) => p ? game.render(p) : p));
		if (msg.data.pos)
			res.pos = msg.data.pos;
		if (game.hash() != msg.data.hash)
			console.log("divergent hash", msg.data);
		game = game;
	}
}

onMount(async () => {
	let lobby = ably.channels.get(ably_namespace + ':lobby');
	await lobby.attach();
	lobby.presence.enter({user: $user, play: game.name});
	let key = ably_namespace + ':' + game.name;
	console.log("init play " + key);
	channel = ably.channels.get(key);
	await channel.attach();
	let history = await channel.history({'direction': 'forwards'});
	for (let msg of history.items)
		handle_message(msg);
	channel.subscribe(handle_message);

	const spaces = new Spaces(ably)
	space = await spaces.get(key);
	await space.enter($user);
	user.subscribe(u => space.updateProfileData(u));
	members   = Object.fromEntries((await space.getState()).members.map(v => [v.connectionId, v]));
	locations = await space.locations.getOthers();
	cursors   = Object.fromEntries(Object.entries(await space.cursors.getAll()).filter((v): v is [string, CursorUpdate] => v[1] !== null));
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
		if (ms.member.connectionId != ably.connection.id) {
			if (locations[ms.member.connectionId])
				locations[ms.member.connectionId].lock = 'Hover';
			let currentLocation = (ms.currentLocation as any);
			locations[ms.member.connectionId] = currentLocation.path ? game.render(currentLocation.path) : null;
			if (locations[ms.member.connectionId]) {
				locations[ms.member.connectionId].lock = 'Select';
				locations[ms.member.connectionId].usercolor = members[ms.member.connectionId].profileData?.color;
				locations[ms.member.connectionId].dragoffset = currentLocation.dragoffset;
			}
			game = game;
		}
	});
	entered = true;
	space.cursors.subscribe((update) => {
		cursors[update.connectionId] = update;
		let selected = locations[update.connectionId];
		if (selected && selected.dragoffset && update.connectionId != ably.connection.id) {
			selected.pos = {x: update.position.x - selected.dragoffset.x, y: update.position.y - selected.dragoffset.y};
			game = game;
		}
		cursors = cursors;
	});
});

onDestroy(() => {
	if (entered)
		space.leave();
});

let gamecomp:GameComp;

function onpointermove({clientX, clientY}:MouseEvent) {
	if (entered)
		space.cursors.set({position: gamecomp.canvas({x: clientX, y: clientY})});
}

function ongameevent(e:any) {
	if (!space || !channel)
		return;
	channel.publish(e.detail.action, e.detail);
}

let selected: string | undefined;
function onlock(e: any): void {
	if (!space)
		return;

	let lock = space.locks.get(e.detail.path);
	if (lock && lock.member.connectionId != ably.connection.id) {
		e.preventDefault();
		return;
	} else if (!lock) {
		space.locks.acquire(e.detail.path);
	} else if (e.detail.lock == 'None') {
		space.locks.release(e.detail.path);
	}

	if (e.detail.lock == 'Select') {
		selected = e.detail.path;
		space.locations.set({path: e.detail.path, dragoffset: e.detail.dragoffset});
	} else if (selected && e.detail.path == selected) {
		selected = undefined;
		space.locations.set({});
	}
}

</script>

<svelte:window on:pointermove|passive="{onpointermove}" on:pointerup|passive="{onpointerup}" />

<GameComp on:lock="{onlock}" on:gameevent="{ongameevent}" bind:this="{gamecomp}" {game} />
{#each Object.values(cursors) as cursor(cursor.connectionId)}
	<div class="absolute pointer-events-none" style="left: {gamecomp.screen(cursor.position).x - 10}px; top: {gamecomp.screen(cursor.position).y - 10}px;">
		<div class="rounded-full border-solid border-2 inline-block" style="width: 21px; height: 21px; border-color: {members[cursor.connectionId]?.profileData?.color}"></div>
		<span class="rounded-xl m-1 p-1" style="background-color: {members[cursor.connectionId]?.profileData?.color}">{members[cursor.connectionId]?.profileData?.name}</span>
	</div>
{/each}
