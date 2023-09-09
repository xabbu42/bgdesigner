<script>
	import "../app.css";
	import { page } from '$app/stores';
	const obj = import.meta.glob('../../static/games/*');
	const games = Object.keys(obj).map((v) => v.match(/([^\/]+)$/, v)[0]);
</script>

<div class="p-4 antialiased text-gray-900">
	<nav class="font-sans border-b-2 p-1 w-full">
		<div>
			<a href="/" class="text-2xl">BGDesigner</a>
			{#each games as game}
				<a href="/game/{game}" class:active={$page.url.pathname === "/game/{game}"}>{game}</a>
			{/each}
		</div>
	</nav>
	<slot />
</div>
<style lang="postcss">
	nav a { @apply text-lg no-underline hover:text-blue-800 p-2 ml-2 rounded-t-lg font-semibold }
	.active { @apply bg-gray-200 }
</style>
