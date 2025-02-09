<script lang="ts">
import { onMount, onDestroy } from 'svelte';

import randomWords from 'random-words';
import { user } from '$lib/stores';
import { ably } from '$lib/init_ably';

import Game from "$lib/Game.js"
import GameComp from "$lib/MultiplayerGame.svelte";

let game;

export let gamedef;
export let ably_namespace = 'bgdesigner';
export let new_play = (play) => {
	game = new Game(gamedef, play);
};

const members = {};
let allplays = [];
let channel;
let unsub;

function handle_member(m) {
	if (m.action == 'leave')
		delete members[m.connectionId];
	else
		members[m.connectionId] = m;
	allplays = Object.values(members).filter(v => v.data.play).reduce((acc, v) => { acc[v.data.play] = (acc[v.data.play] || []).concat(v); return acc }, {});
}

onMount(async () => {
	let key = ably_namespace + ':lobby';
	console.log(key);
	channel = await ably.channels.get(key);
	channel.presence.enter({user: $user});
	let unsub = user.subscribe((v) => channel.presence.update({user: v}));
	channel.presence.subscribe(handle_member);
	(await channel.presence.get()).map(handle_member);
});

onDestroy(() => {
	if (channel)
		channel.presence.unsubscribe();
	if (unsub)
		unsub();
});
</script>

{#if game}
	<GameComp {game} />
{:else}
	<div class="p-2 grid gap-2">
		{#each Object.entries(allplays) as [play, members]}
			<button class="border border-slate-200 rounded-lg" on:click={(e) => new_play(play)}>
				<h2 class="m-1 p-1 font-bold">{play}</h2>
				<ul class="flex flex-row flex-wrap items-start">
					{#each members as member(member.connectionId)}
						<li class="m-1 p-1 rounded-xl text-nowrap" style="background-color: {member.data.user.color}">{member.data.user.name}</li>
					{/each}
				</ul>
			</button>
		{/each}
		<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" on:click={(e) => new_play(randomWords())}>
			New
		</button>
	</div>
{/if}
