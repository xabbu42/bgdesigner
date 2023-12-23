<script>
	import { onMount,tick } from 'svelte';
	export let token;
	let div;
	let pos = {x:0, y:0};
	onMount(async () => {
		let rect = div.getBoundingClientRect();
		let initialpos = {x: rect.left, y: rect.top};
		await tick();
		div.style = "position: absolute";
		pos = initialpos;
	});
</script>

<div
	bind:this="{div}"
	on:dblclick|preventDefault="{(e) => {token.flip(); token = token}}"
	on:mousedown|preventDefault|stopPropagation="{(e) => {div.parentNode.appendChild(div)}}"
	on:mousemove|preventDefault|stopPropagation="{(e) => {
		if (e.buttons == 1) {
			pos = {x: pos.x + e.movementX, y: pos.y + e.movementY};
		}
	}}"
	style="left: {pos.x}px; top: {pos.y}px"
>
	{@html token}
</div>
