<script>
	import { page } from '$app/stores';
</script>

<div class="flex flex-col h-full w-full">
	<nav class="font-sans border-b-2 p-1 mb-1">
		<div>
			<a href="/game/{$page.params.name}/" class:active="{$page.route.id == '/game/[name]'}" class="text-lg">setup</a>
			<a href="/game/{$page.params.name}/components" class:active="{$page.route.id == '/game/[name]/components'}">components</a>
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
