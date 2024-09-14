<script lang="ts">
import { page } from '$app/stores';
import { onMount, onDestroy, getContext } from 'svelte';
import { writable } from 'svelte/store';
import Game from "$lib/Game.js"
import GameComp from "$lib/Game.svelte"

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
let cursors = {};

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
		await space.enter();
		cursors = Object.fromEntries(Object.entries(await space.cursors.getAll()).filter(v => v[1] != undefined));
		space.members.subscribe('leave', (ms) => {
			delete cursors[ms.connectionId];
		});
		entered = true;
		space.cursors.subscribe(async (update) => {
			cursors[update.connectionId] = update;
			cursors = cursors;
		});
	}
});

let position;
function onpointermove({clientX, clientY}) {
	if (entered)
		space.cursors.set({position: {x: clientX, y: clientY}, data: $user});
}

onDestroy(() => {
	if (space)
		space.leave();
});

function handle_message(msg) {
	if (msg.connectionId != $ably.connection.id) {
		let obj = msg.data.path ? $game.render(msg.data.path) : $game;
		let res = obj[msg.data.action](...(msg.data.args || []).map(p => p ? $game.render(p) : p));
		if (msg.data.pos)
			res.pos = msg.data.pos;
		$game = $game;
	}
}
</script>

<svelte:head>
	<title>{$page.params.name} - {$page.params.play}</title>
</svelte:head>
<svelte:window on:pointermove|passive="{onpointermove}" on:pointerup|passive="{onpointerup}" />

<GameComp on:gameevent="{e => {if (channel) channel.publish(e.detail.action, e.detail)}}" {game} />
{#each Object.values(cursors) as cursor(cursor.connectionId)}
	<div class="absolute pointer-events-none" style="left: {cursor.position.x - 10}px; top: {cursor.position.y - 10}px;">
		<div class="rounded-full border-solid border-2 inline-block" style="width: 21px; height: 21px; border-color: {cursor.data.color}"></div>
		<span class="rounded-xl m-1 p-1" style="background-color: {cursor.data.color}">{cursor.data.name}</span>
	</div>
{/each}
