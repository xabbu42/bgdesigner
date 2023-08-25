<script>
	import "iconify-icon";
	import { render,allpathes } from "../lib/render.ts";
	export let data;
	let name = 'jass.json';
	let things = [];
	const templates = [...allpathes(data)].filter((v) => v.startsWith('.'));
	things = render(templates[0].substring(1), data, data).flat(Infinity);
</script>
<h1>{name}</h1>
<div class="game">
	{#each things as thing}
		<div class="thing">
			{@html thing}
		</div>
	{/each}
</div>

<style>
	.game {display: flex; flex-wrap: wrap}
	.thing {padding: 0.5em}
</style>
