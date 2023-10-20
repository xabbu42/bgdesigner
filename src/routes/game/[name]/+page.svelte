<script>
	import "iconify-icon";
	import { tick } from "svelte";
	import { textfit } from "../../../lib/textfit.ts";
	import { render,alltemplates,getpath } from "../../../lib/render.ts";
	export let data;
	let things;
	$:things = Object.fromEntries(
		[...alltemplates(data)]
			.filter( (p) => getpath(data, p.substring(1)))
			.map(    (p) => [p, render(p.substring(1), data).flat(Infinity)])
	);

	function apply_textfit() {
		for (const el of document.querySelectorAll(".text-fit-down")) {
			if (!el.style.fontSize)
				textfit(el, {down: true});
		}
		for (const el of document.querySelectorAll(".text-fit-up")) {
			if (!el.style.fontSize)
				textfit(el, {up: true});
		}
		for (const el of document.querySelectorAll(".text-fit")) {
			if (!el.style.fontSize)
				textfit(el);
		}
	}

	tick(() => apply_textfit());

</script>
<div>
	<table class="m-2">
		{#each Object.entries(things) as [path, perpath]}
			<tr><td class="p-1">{path}</td><td class="p-1 text-right">{perpath.length}</td></tr>
		{/each}
	</table>
</div>

<div class="flex flex-wrap">
	{#each Object.entries(things) as [path, perpath]}
		{#each perpath as thing}
			<div class="p-1" use:apply_textfit>
				{@html thing}
			</div>
		{/each}
	{/each}
</div>
