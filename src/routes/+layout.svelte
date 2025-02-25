<script lang="ts">
import { onMount } from 'svelte';
import "../app.css";
import { page } from '$app/stores';
import { user } from '$lib/stores.js';
import { hashcolor } from '$lib/utils.js';

const obj = import.meta.glob('../../static/games/*');
const games = Object.keys(obj).map((v) => v.match(/([^\/]*)$/)![0]);

let name = $user.name;
onMount(() => {
	return user.subscribe((v) => name = v.name);
});

</script>

<div class="p-1 antialiased text-gray-900 h-screen w-screen flex flex-col">
	<nav class="font-sans border-b-2 p-1 mb-1">
		<div>
			<a href="/" class="text-2xl">BGDesigner</a>
			{#each games as game}
				<a href="/game/{game}" class:active={$page.params.name === game}>{game}</a>
			{/each}
			<form class="inline float-end" on:submit="{(e) => $user = {name, color: hashcolor(name)}}"><input class="m-1 select-all" id="seed" type="text" bind:value={name} /></form>
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
