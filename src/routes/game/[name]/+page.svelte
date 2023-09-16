<script>
	import "iconify-icon";
	import { tick } from "svelte";
	import { textfit } from "../../../lib/textfit.ts";
	import { render,alltemplates,getpath } from "../../../lib/render.ts";
	export let data;
	let things = [];
	let templates;
	$: templates = [...alltemplates(data)];
	$: things = templates.map((v) => getpath(data, v.substring(1)) ? render(v.substring(1), data) : []).flat(Infinity);

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
<div class="flex flex-wrap">
	{#each things as thing}
		<div class="p-1" use:apply_textfit>
			{@html thing}
		</div>
	{/each}
</div>
