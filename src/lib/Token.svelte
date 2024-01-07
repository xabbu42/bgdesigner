<script>
	import { onMount,tick } from 'svelte';

	export let token;
	export let camera;
	export let selected;
	let classes = '';
	export { classes as class };
	let div;

	onMount(async () => {
		let initialpos = {x: div.offsetLeft, y: div.offsetTop};
		await tick();
		div.style = "position: absolute";
		token.pos = initialpos;
	});
</script>

<div
	class="{classes}"
	bind:this="{div}"
	bind:clientWidth="{token.width}"
	bind:clientHeight="{token.height}"
	on:dblclick|preventDefault="{(e) => {token.flip(); token = token}}"
	on:pointerdown|preventDefault|stopPropagation="{(e) => {
		if (e.button === 0) {
			div.setPointerCapture(e.pointerId); token.draging = true; $selected = token;
		}
	}}"
	on:contextmenu|preventDefault="{(e) => {token.menu = {x: e.clientX, y: e.clientY}; $selected = token}}"
	style="left: {token.pos.x}px; top: {token.pos.y}px; z-index: {$selected == token ? 50 : 0}"
>
	{@html token}
</div>
<svelte:window
	on:pointermove="{(e) => token.draging ? token.pos = {x: token.pos.x + e.movementX / camera.z, y: token.pos.y + e.movementY / camera.z} : null}"
/>
