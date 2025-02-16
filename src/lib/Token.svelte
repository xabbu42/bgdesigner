<script lang="ts">
	import {Lock} from "./types.js";
	import { onMount,tick } from 'svelte';

	export let token;
	let div:HTMLElement;

	onMount(async () => {
		let initialpos = {x: div.offsetLeft, y: div.offsetTop};
		token.width = div.offsetWidth;
		token.height = div.offsetHeight;
		await tick();
		if (!token.pos)
			token.pos = initialpos;
	});
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	bind:this="{div}"
	style="{token.pos ? `position: absolute; left: ${token.pos.x}px; top: ${token.pos.y}px;` : ''}; z-index: {token.lock == Lock.Hover ? 50 : 0}; outline-width: 4px; outline-style:{token.lock == Lock.None ? 'none' : token.lock == Lock.Hover ? 'dotted' : 'solid'}; outline-color:{token.usercolor}"
	on:pointerdown
	on:contextmenu
>
	{@html token}
</div>
