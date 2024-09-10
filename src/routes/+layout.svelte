<script lang="ts">
import { onMount, onDestroy, setContext } from 'svelte';
import { writable } from 'svelte/store';
import "../app.css";
import { page } from '$app/stores';
import { hashcolor } from '$lib/utils';
import * as env from '$env/static/public';


const obj = import.meta.glob('../../static/games/*');
const games = Object.keys(obj).map((v) => v.match(/([^\/]*)$/)![0]);

import rug from 'random-username-generator';

import Ably from 'ably';
import Spaces from '@ably/spaces';

let username = rug.generate();
let color = hashcolor(username);
let members = writable([]);
let ably = writable();
setContext('members', members);
setContext('ably', ably);

let spaces;
let space;

function change_username(newusername) {
	localStorage.setItem('username', newusername);
	username = newusername;
	color = hashcolor(username);
	space.locations.set({params: $page.params, username, color});
}

if ('PUBLIC_ABLY_KEY' in env) {
	onMount(async () => {
		username = localStorage.getItem('username') || username;
		$ably = new Ably.Realtime({key: env.PUBLIC_ABLY_KEY, clientId: username});
		spaces = new Spaces($ably);
		space = await spaces.get('bgdesigner');
		space.subscribe('update', (vs) => $members = vs.members.filter(v => v.isConnected));
		await space.enter();
		space.locations.set({params: $page.params, username, color});
		page.subscribe(v => space.locations.set({params: v.params, username, color}));
	});

	onDestroy(() => {
		if (space)
			space.leave();
		if ($ably)
			$ably.close();
	});
}
</script>

<div class="p-1 antialiased text-gray-900 h-screen w-screen flex flex-col">
	<nav class="font-sans border-b-2 p-1 mb-1">
		<div>
			<a href="/" class="text-2xl">BGDesigner</a>
			{#each games as game}
				<a href="/game/{game}" class:active={$page.params.name === game}>{game}</a>
			{/each}
			<form class="inline float-end" on:submit="{(e) => change_username(username)}"><input class="m-1 select-all" id="seed" type="text" bind:value={username} /></form>
		</div>
	</nav>
	<div class="grow">
		<slot />
	</div>
</div>
<style lang="postcss">
	nav a { @apply text-lg no-underline hover:text-blue-800 p-2 ml-2 rounded-t-lg font-semibold }
	.active { @apply bg-gray-200 }
</style>
