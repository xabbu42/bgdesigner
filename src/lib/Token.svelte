<script>
	import { onMount,tick } from 'svelte';
	export let token;
	export let camera;
	let div;
	let pos = {x:0, y:0};
	let dragging = false;
	onMount(async () => {
		let initialpos = {x: div.offsetLeft, y: div.offsetTop};
		await tick();
		div.style = "position: absolute";
		pos = initialpos;
	});
</script>

<div
	bind:this="{div}"
	on:dblclick|preventDefault="{(e) => {token.flip(); token = token}}"
	on:mousedown|preventDefault|stopPropagation="{(e) => {dragging = true; div.parentNode.appendChild(div)}}"
	style="left: {pos.x}px; top: {pos.y}px"
>
	{@html token}
</div>
<svelte:window
	on:mousemove="{(e) => dragging ? pos = {x: pos.x + e.movementX / camera.z, y: pos.y + e.movementY / camera.z} : null}"
	on:mouseup="{(e) => dragging = false}"
/>
