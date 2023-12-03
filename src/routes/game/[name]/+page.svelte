<script>
	import "iconify-icon";
	import { tick } from "svelte";
	import { textfit } from "../../../lib/textfit.ts";
	import Token from "../../../lib/Token.svelte";
	export let data;
	let things;
	$:things = data.game.allcomponents().reduce((t, v) => {let k = v.path.replace(/\.\d+.*$/, ''); t[k] = (t[k] || []); t[k].push(v); return t}, {});

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

<div class="flex flex-wrap gap-1" use:apply_textfit>
	{#each Object.entries(things) as [path, perpath]}
		{#each perpath as thing}
			<Token token="{thing}" />
		{/each}
	{/each}
</div>
