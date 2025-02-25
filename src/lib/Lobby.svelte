<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { type Unsubscriber } from 'svelte/store'

import randomWords from 'random-words';
import { user } from '$lib/stores.js';
import { ably } from '$lib/init_ably.js';
import { hashcolor } from '$lib/utils.js';

import { type SpaceMember } from '@ably/spaces';
import { type RealtimeChannel, type PresenceMessage } from 'ably';

import Game from "$lib/Game.js"
import GameComp from "$lib/MultiplayerGame.svelte";

let game:Game;

export let gamedef;
export let ably_namespace = 'bgdesigner';
export let new_play = (play:string) => {
	game = new Game(gamedef, play);
};

const members:Record<string, PresenceMessage> = {};
let allplays:Record<string, PresenceMessage[]> = {};
let channel:RealtimeChannel;
let unsub:Unsubscriber;
let changeusername:HTMLDialogElement;
let usernameinput = $user.name;
let name = $user.name;

function handle_member(m:PresenceMessage) {
	if (m.action == 'leave')
		delete members[m.connectionId];
	else
		members[m.connectionId] = m;
	allplays = Object.values(members).filter(v => v.data.play).reduce((acc:Record<string, PresenceMessage[]>, v) => { acc[v.data.play as string] = (acc[v.data.play as string] || []).concat(v); return acc }, {});
}

onMount(async () => {
	let key = ably_namespace + ':lobby';
	console.log(key);
	channel = await ably.channels.get(key);
	channel.presence.enter({user: $user});
	unsub = user.subscribe((v) => {name = v.name; usernameinput = v.name; channel.presence.update({user: v})});
	channel.presence.subscribe(handle_member);
	(await channel.presence.get()).map(handle_member);
});

onDestroy(() => {
	if (channel)
		channel.presence.unsubscribe();
	if (unsub !== undefined)
		unsub();
});

</script>

<dialog bind:this={changeusername} class="p-4 rounded-lg bg-white shadow-sm" >
	<form class="" on:submit={(ev) => { $user.name = usernameinput; changeusername.close() }}>
		<label for="username" class="block mb-2 font-medium text-gray-900">Change Name</label>
		<input type="text" id="username" bind:value={usernameinput}
			   class="rounded-md border border-transparent py-2 px-4 text-center transition-all text-slate-600 hover:bg-slate-100 focus:bg-slate-100 active:bg-slate-100"
		/>
		<button type="submit" class="align-middle bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m9 20.42l-6.21-6.21l2.83-2.83L9 14.77l9.88-9.89l2.83 2.83z"/></svg>
		</button>
	</form>
</dialog>

{#if game}
	<GameComp {game} />
{:else}
	<div class="p-2 grid gap-2">
		<div>
			<span class="text-gray-700 font-bold mb-2 text-gray-900">Name:</span>
		</div>
		<div>
			{name}
			<button class="align-middle bg-blue-500 hover:bg-blue-700 text-white font-bold p-1 rounded" on:click={() => changeusername.showModal()}>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83l3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75z"/></svg>
			</button>
		</div>
		<div>
			<span class="text-gray-700 font-bold mb-2 text-gray-900">Games:</span>
		</div>
		{#each Object.entries(allplays) as [play, members]}
			<button class="border border-slate-200 rounded-lg" on:click={(e) => new_play(play)}>
				<h3 class="m-1 p-1 font-bold">{play}</h3>
				<ul class="flex flex-row flex-wrap items-start">
					{#each members as member(member.connectionId)}
						<li class="m-1 p-1 rounded-xl text-nowrap" style="background-color: {member.data.user.color}">{member.data.user.name}</li>
					{/each}
				</ul>
			</button>
		{/each}
		<div>
			<button class="align-middle bg-blue-500 hover:bg-blue-700 text-white font-bold p-1 rounded" on:click={(e) => new_play(randomWords(1)[0])}>
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20 14h-6v6h-4v-6H4v-4h6V4h4v6h6z"/></svg>
			</button>
		</div>
	</div>
{/if}
