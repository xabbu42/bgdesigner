<script>
	import Game from "$lib/Game.svelte";
	export let data;

	let game = data.game;
	let components = $game.allcomponents();
</script>

<div class="flex flex-wrap gap-1">
	{#each components as component(component.path)}
		{@html component}
	{/each}
</div>
