<script lang="ts">
	import type {Point} from "types.ts";
	import { writable,get } from 'svelte/store';
	import Token from "./Token.svelte";
	import { textfit } from "./textfit.ts";

	export let game;

	let dragitem = writable();

	let components = game.allcomponents();

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

	function canvas(p: Point, c = camera) {
		return { x: p.x / c.z - c.x, y: p.y / c.z - c.y };
	}

	function screen(p: Point, c = camera) {
		return { x: (p.x + c.x) * c.z, y: (p.y + c.y) * c.z };
	}

	function zoom(point: Point, dz) {
		const z = camera.z - dz * camera.z
		const p1 = canvas(point)
		const p2 = canvas(point, { ...camera, z:z})
		camera = {
			x: camera.x + (p2.x - p1.x),
			y: camera.y + (p2.y - p1.y),
			z: z,
		}
	}

	function pan(d: Point) {
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

	function onpointermove (e) {
		let di = get(dragitem);
		if (paning)
			pan({x: -e.movementX, y: -e.movementY});
		else if (di) {
			let p = canvas(event_point(e));
			for (let component of components.toReversed()) {
				if (component != di && p.x > component.pos.x && p.x < component.pos.x + component.width && p.y > component.pos.y && p.y < component.pos.y + component.height) {
					dropitem = component;
					return;
				}
			}
			dropitem = null;
		}
	}

	function onpointerup(e) {
		paning = false;
		dropitem = null;
	}

	let paning = false;
	let dropitem = null;
</script>

<div class="viewport relative overflow-hidden w-full h-full"
	bind:this="{viewport}"
	on:wheel|preventDefault="{(e) => zoom(event_point(e), e.deltaY / 1000)}"
	on:pointerdown|preventDefault="{(e) => paning = true}"
>
	<div class="canvas absolute origin-top-left" style="transform: scale({camera.z}) translate({camera.x}px,{camera.y}px)" use:apply_textfit>
		<div class="flex flex-wrap gap-1">
			{#each components as component(component.path)}
				<Token token="{component}" camera="{camera}" dragitem="{dragitem}" class="{dropitem == component ? 'outline outline-4 outline-blue-400/50' : ''}" />
			{/each}
		</div>
	</div>
	<div class="overlay absolute right-1 bottom-1 shadow-md bg-slate-100 p-1" >
	</div>
</div>

<svelte:window on:pointermove="{onpointermove}" on:pointerup="{onpointerup}" />
