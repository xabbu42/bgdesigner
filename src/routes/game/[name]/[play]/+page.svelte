<script lang="ts">
import { page } from '$app/stores';
import { onMount, getContext } from 'svelte';
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
ably.subscribe(async a => {
	if (a) {
		channel = $ably.channels.get('games:' + $page.params.name + '_' + $page.params.play);
		await channel.attach();
		let history = await channel.history({'direction': 'forwards'});
		for (let msg of history.items)
			handle_message(msg);
		channel.subscribe(handle_message);
	}
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

<GameComp on:gameevent="{e => {if (channel) channel.publish(e.detail.action, e.detail)}}" {game} />
