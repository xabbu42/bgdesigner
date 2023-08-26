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
<div class="flex flex-wrap">
	{#each things as thing}
		<div class="p-1">
			{@html thing}
		</div>
	{/each}
</div>
