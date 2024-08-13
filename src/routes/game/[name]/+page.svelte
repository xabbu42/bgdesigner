<script>
	import Game from "$lib/Game.svelte";
	export let data;
</script>

{#key data.game}
	<Game game="{data.game}" />
{/key}
