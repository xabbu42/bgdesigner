<script>
	import { onMount } from 'svelte';
	export let token;
	let div;
	/* onMount(() => {
	   const resizeObserver = new ResizeObserver(entries => {
	   if (div) {
	   div.style.transform = "scale(" + (div.parentNode.offsetWidth / div.offsetWidth) + ")";
	   }
	   });
	   resizeObserver.observe(div.parentNode);
	   return () => resizeObserver.unobserve(div);
	   }); */
</script>

<div
	bind:this="{div}"
	on:dblclick|preventDefault="{(e) => {token.flip(); token = token}}"
>
	{@html token}
</div>
