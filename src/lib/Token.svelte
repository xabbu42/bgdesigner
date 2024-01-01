<script>
	import { onMount,tick } from 'svelte';
	import { get } from 'svelte/store'

	export let token;
	export let camera;
	export let dragitem;
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
	on:pointerdown|preventDefault|stopPropagation="{(e) => {div.setPointerCapture(e.pointerId); dragitem.set(token)}}"
	style="left: {token.pos.x}px; top: {token.pos.y}px"
>
	{@html token}
</div>
<svelte:window
	on:pointermove="{(e) => get(dragitem) == token ? token.pos = {x: token.pos.x + e.movementX / camera.z, y: token.pos.y + e.movementY / camera.z} : null}"
	on:pointerup="{(e) => dragitem.set(null)}"
/>
