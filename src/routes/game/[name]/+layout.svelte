<script>
	import { page } from '$app/stores';

	export let data;
	let setups = Object.keys(data.game.getpath('setups') || {});
</script>

<div class="flex flex-col h-full w-full">
	<nav class="font-sans border-b-2 p-1 mb-1">
		<div>
			<a data-sveltekit-reload href="/game/{$page.params.name}/" class="text-lg">setup</a>
			{#each setups as setup}
				<a data-sveltekit-reload href="/game/{$page.params.name}/{setup}" class:active="{$page.params.setup === setup}">{setup}</a>
			{/each}
			<a data-sveltekit-reload href="/game/{$page.params.name}/components">components</a>
		</div>
	</nav>
	<div class="grow">
		<slot />
	</div>
</div>

<style lang="postcss">
	nav a { @apply no-underline hover:text-blue-800 p-2 ml-2 rounded-t-lg font-semibold }
	.active { @apply bg-gray-200 }
</style>
