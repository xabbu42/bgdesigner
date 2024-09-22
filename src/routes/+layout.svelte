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

let name = rug.generate();
let user = writable({name, color: hashcolor(name)});
let members = writable([]);
let ably = writable();
let spaces = writable();
setContext('user', user);
setContext('members', members);
setContext('ably', ably);
setContext('spaces', spaces);

let channel;
function change_username(newusername) {
	sessionStorage.setItem('username', newusername);
	$user = {name: newusername, color: hashcolor(newusername)};
}

if ('PUBLIC_ABLY_KEY' in env) {
	onMount(async () => {
		name = sessionStorage.getItem('username') || name;
		$user = {name, color: hashcolor(name)};
		$ably = new Ably.Realtime({key: env.PUBLIC_ABLY_KEY, clientId: $user.name});
		$spaces = new Spaces($ably);
		channel = $ably.channels.get('bgdesigner');
		channel.presence.enter({user:$user,params: $page.params});
		page.subscribe((v) => channel.presence.update({user:$user, params: v.params}));
		user.subscribe((v) => channel.presence.update({user:v, params: $page.params}));
		channel.presence.subscribe(async (m) => $members = await channel.presence.get());
	});

	onDestroy(() => {
		if (channel)
			channel.detach();
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
			<form class="inline float-end" on:submit="{(e) => change_username(name)}"><input class="m-1 select-all" id="seed" type="text" bind:value={name} /></form>
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
