<script>
	import "../app.css";
	import { page } from '$app/stores';
</script>

<div class="p-4">
	<nav class="font-sans border-b-2 p-1 w-full">
		<div>
		<a href="/" class="text-2xl">BGDesigner</a>
		<a href="/game/jass.json" class:active={$page.url.pathname === "/game/jass.json"}>jass</a>
		<a href="/game/thecrew.json" class:active={$page.url.pathname === "/game/thecrew.json"}>thecrew</a>
		</div>
	</nav>
	<slot />
</div>
<style lang="postcss">
	nav a { @apply text-lg no-underline text-gray-900 hover:text-blue-800 p-2 ml-2 rounded-t-lg font-semibold }
	.active { @apply bg-gray-200 }
</style>
