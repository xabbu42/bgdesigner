<script>
	import Game from '$lib/Game.svelte';
	import { page } from '$app/stores';
	export let data;
</script>
<Game game="{data.game}" setup="{$page.params.setup}" />
