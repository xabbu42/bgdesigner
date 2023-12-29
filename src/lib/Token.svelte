<script>
	import { onMount,tick } from 'svelte';
	import { get } from 'svelte/store'

	export let token;
	export let camera;
	export let dragitem;
	let classes = '';
	export { classes as class };
	let div;

	let dragging = false;
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
	on:mousedown|preventDefault|stopPropagation="{(e) => dragitem.set(token)}"
	style="left: {token.pos.x}px; top: {token.pos.y}px"
>
	{@html token}
</div>
<svelte:window
	on:mousemove="{(e) => get(dragitem) == token ? token.pos = {x: token.pos.x + e.movementX / camera.z, y: token.pos.y + e.movementY / camera.z} : null}"
	on:mouseup="{(e) => dragitem.set(null)}"
/>
