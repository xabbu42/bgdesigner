<script lang="ts">
	import { onMount,tick } from 'svelte';

	export let token;
	export let camera;
	export let selected;
	let classes = '';
	export { classes as class };
	let div:HTMLElement;

	onMount(async () => {
		let initialpos = {x: div.offsetLeft, y: div.offsetTop};
		token.width = div.offsetWidth;
		token.height = div.offsetHeight;
		await tick();
		token.pos = initialpos;
	});
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="{classes}"
	bind:this="{div}"
	on:pointerdown|preventDefault|stopPropagation="{(e) => {
		if (e.button === 0) {
			div.setPointerCapture(e.pointerId); token.draging = true; $selected = token;
		}
	}}"
	on:contextmenu|preventDefault="{(e) => {token.menu = {x: e.clientX, y: e.clientY}; $selected = token}}"
	style="{token.pos ? `position: absolute; left: ${token.pos.x}px; top: ${token.pos.y}px;` : ''} z-index: {$selected == token ? 50 : 0}"
>
	{@html token}
</div>
<svelte:window
	on:pointermove="{(e) => token.draging ? token.pos = {x: token.pos.x + e.movementX / camera.z, y: token.pos.y + e.movementY / camera.z} : null}"
/>
