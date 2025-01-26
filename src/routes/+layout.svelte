<script lang="ts">
import "../app.css";
import { page } from '$app/stores';
import { user } from '$lib/stores';

const obj = import.meta.glob('../../static/games/*');
const games = Object.keys(obj).map((v) => v.match(/([^\/]*)$/)![0]);

let name;

function change_username(newusername) {
	sessionStorage.setItem('username', newusername);
	$user = {name: newusername, color: hashcolor(newusername)};
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
