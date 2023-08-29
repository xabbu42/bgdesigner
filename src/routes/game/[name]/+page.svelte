<script>
	import "iconify-icon";
	import { render,allpathes } from "../../../lib/render.ts";
	export let data;
	let things = [];
	const templates = [...allpathes(data)].filter((v) => v.startsWith('@'));
	$: things = render(templates[0].substring(1), data).flat(Infinity);
</script>
<div class="flex flex-wrap">
	{#each things as thing}
		<div class="p-1">
			{@html thing}
		</div>
	{/each}
</div>
