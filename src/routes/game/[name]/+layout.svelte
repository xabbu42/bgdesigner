<script>
import { page } from '$app/stores';
</script>

<div class="flex flex-col h-full w-full">
	<nav class="font-sans border-b-2 p-1 mb-2">
		<div>
			<a href="/game/{$page.params.name}/" class:bg-gray-200="{$page.route.id == '/game/[name]'}" class="text-lg">overview</a>
			<a href="/game/{$page.params.name}/lobby" class:bg-gray-200="{$page.route.id == '/game/[name]/lobby'}">lobby</a>
		</div>
	</nav>
	<div class="grow">
		{#key $page.params.name}
			<slot />
		{/key}
	</div>
</div>

<style lang="postcss">
	nav a { @apply no-underline hover:text-blue-800 p-2 ml-2 rounded-t-lg font-semibold }
</style>
