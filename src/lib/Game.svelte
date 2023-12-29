<script>
	import { writable,get } from 'svelte/store';
	import Token from "./Token.svelte";
	import { textfit } from "./textfit.ts";

	export let game;

	let dragitem = writable();

	let components = game.allcomponents();
	let elements = {};

	dragitem.subscribe((component) => {
		if (component)
			components = [...components.filter(v => v != component), component];
	})

	let camera = {x: 0, y: 0, z: 1};
	let viewport;

	function event_point(e) {
		var rect = viewport.getBoundingClientRect();
		return {x: e.clientX - rect.left, y: e.clientY - rect.top};
	}

	function canvas(point, camera) {
		return {
			x: point.x / camera.z - camera.x,
			y: point.y / camera.z - camera.y,
		}
	}

	function screen(point, camera) {
		return {
			x: (point.x + camera.x) * camera.z,
			y: (point.y + camera.y) * camera.z,
		}
	}

	function zoom(point, dz) {
		const z = camera.z - dz * camera.z
		const p1 = canvas(point, camera)
		const p2 = canvas(point, { ...camera, z:z})
		camera = {
			x: camera.x + (p2.x - p1.x),
			y: camera.y + (p2.y - p1.y),
			z: z,
		}
	}

	function pan(d) {
		camera = {
			x: camera.x - d.x / camera.z,
			y: camera.y - d.y / camera.z,
			z: camera.z,
		}
	}

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

	function onmousemove(e) {
		let di = get(dragitem);
		if (paning)
			pan({x: -e.movementX, y: -e.movementY});
		else if (di) {
			for (let component of components.toReversed()) {
				let rect = elements[component.path].div.getBoundingClientRect();
				if (component != di && e.clientX > rect.left && e.clientX < rect.right && e.clientY > rect.top && e.clientY < rect.bottom) {
					dropitem = component;
					break;
				}
			}
		}
	}

	function onmouseup(e) {
		paning = false;
		dropitem = null;
	}

	let paning = false;
	let dropitem = null;
</script>

<div class="viewport relative overflow-hidden w-full h-full"
	bind:this="{viewport}"
	on:wheel|preventDefault="{(e) => zoom(event_point(e), e.deltaY / 1000)}"
	on:mousedown|preventDefault="{(e) => paning = true}"
>
	<div class="canvas absolute origin-top-left" style="transform: scale({camera.z}) translate({camera.x}px,{camera.y}px)" use:apply_textfit>
		<div class="flex flex-wrap gap-1">
			{#each components as component(component.path)}
				<Token bind:this="{elements[component.path]}" token="{component}" camera="{camera}" dragitem="{dragitem}" class="{dropitem == component ? 'outline outline-4 outline-blue-400/50' : ''}" />
			{/each}
		</div>
	</div>
	<div class="overlay absolute right-1 bottom-1 shadow-md bg-slate-100 p-1" >
	</div>
</div>

<svelte:window on:mousemove="{onmousemove}" on:mouseup="{onmouseup}" />
