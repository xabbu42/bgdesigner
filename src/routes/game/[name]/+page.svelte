<script lang="ts">
import { page } from '$app/stores';

export let data;

let components = data.game.allcomponents();
</script>

<svelte:head>
	<title>{$page.params.name} - Overview</title>
</svelte:head>

<div class="flex flex-wrap gap-1">
	{#each components as component(component.path)}
		{@html component}
	{/each}
</div>
