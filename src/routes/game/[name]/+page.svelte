<script>
	import "iconify-icon";
	import { render,alltemplates,getpath } from "../../../lib/render.ts";
	export let data;
	let things = [];
	const templates = [...alltemplates(data)];
	$: things = templates.map((v) => getpath(data, v.substring(1)) ? render(v.substring(1), data) : []).flat(Infinity);
</script>
<div class="flex flex-wrap">
	{#each things as thing}
		<div class="p-1">
			{@html thing}
		</div>
	{/each}
</div>
