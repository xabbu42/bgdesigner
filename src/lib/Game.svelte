<script>
	import Token from "./Token.svelte";
	import { tick } from "svelte";
	import { textfit } from "./textfit.ts";

	export let game;
	$:components = game.allcomponents();

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

<div class="flex flex-wrap gap-1"  use:apply_textfit>
	{#each components as component}
		<Token token="{component}" />
	{/each}
</div>
