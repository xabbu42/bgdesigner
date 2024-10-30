<script lang="ts">
	import {type Point, UserMode} from "./types.js";
	import { type Writable, writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';

	import Token from "./Token.svelte";
	import { textfit } from "./utils.js";
	import { Collection,Stack } from "./collections.js";
	import type { Game } from "./Game.js";

	export let game:Writable<Game>;
	export let user;

	const dispatch = createEventDispatcher();

	let camera = {x: 0, y: 0, z: 1};
	let viewport:HTMLElement;

	export function canvas(p: Point, c = camera) {
		var rect = viewport.getBoundingClientRect();
		return { x: (p.x - rect.left) / c.z - c.x, y: (p.y - rect.top) / c.z - c.y };
	}

	export function screen(p: Point, c = camera) {
		var rect = viewport.getBoundingClientRect();
		return { x: (p.x + c.x) * c.z + rect.left, y: (p.y + c.y) * c.z + rect.top };
	}

	function zoom(point: Point, dz: number) {
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

	function apply_textfit(element:HTMLElement) {
		for (const el of element.querySelectorAll(".text-fit-down") as NodeListOf<HTMLElement>) {
			if (!el.style.fontSize)
				textfit(el, {down: true});
		}
		for (const el of element.querySelectorAll(".text-fit-up") as NodeListOf<HTMLElement>) {
			if (!el.style.fontSize)
				textfit(el, {up: true});
		}
		for (const el of element.querySelectorAll(".text-fit") as NodeListOf<HTMLElement>) {
			if (!el.style.fontSize)
				textfit(el);
		}
	}

	let paning = false;
	let selected: Component | null = null;
	let hovered: Component | null = null;

	function onpointermove (e:MouseEvent) {
		if (paning)
			pan({x: -e.movementX, y: -e.movementY});
		else if (!selected || selected.usermode != UserMode.Menu) {
			let p = canvas(e);
			let newhovered;
			for (let component of $game.state.toReversed()) {
				if (component != selected && component.pos && component.width && component.height && p.x > component.pos.x && p.x < component.pos.x + component.width && p.y > component.pos.y && p.y < component.pos.y + component.height) {
					newhovered = component;
					break;
				}
			}

			if (hovered != newhovered) {
				if (hovered) {
					hovered.usermode = UserMode.None;
					hovered = null;
				}
				if (dispatch('uievent', {hovered: newhovered?.path, selected: selected?.path, dragoffset: selected?.dragoffset}, {cancelable: true})) {
					hovered = newhovered;
					if (hovered) {
						hovered.usermode = UserMode.Hover;
						hovered.usercolor = $user.color;
					}
				}
			}
			if (selected && selected.usermode == UserMode.Drag)
				selected.pos = {x: p.x - selected.dragoffset.x, y: p.y - selected.dragoffset.y};
			$game = $game;
		}
	}

	let stackcount = 0;
	function onpointerup(e:MouseEvent) {
		paning = false;
		if (selected && selected.usermode == UserMode.Drag) {
			if (dispatch('gameevent', {action: 'drop', pos: hovered ? null : selected.pos, args: [selected.path, hovered ? hovered.path : undefined]}, {cancelable: true})) {
				selected.usermode = UserMode.None;
				let newhovered = $game.drop(selected, hovered);
				if (dispatch('uievent', {hovered: newhovered?.path, selected: null}, {cancelable: true})) {
					hovered = newhovered;
					if (hovered) {
						hovered.usermode = UserMode.Hover;
						hovered.usercolor = $user.color;
					}
				}
				selected = null;
				$game = $game;
			}
		}
	}

</script>

{#if selected && selected.usermode == UserMode.Menu}
	<nav class="border-2 p-1 border-gray-700 rounded-lg bg-white z-50" style="position: absolute; top:{selected.menu.y - 10}px; left:{selected.menu.x - 10}px" on:pointerleave="{e => selected = null}">
		<ul>
			{#each ['flip', 'shuffle'] as action}
				{#if selected && action in selected}
					<li class="w-full">
						<button
							class="w-full hover:bg-gray-200 p-1 rounded-lg"
							on:click={(e) => {
								if (dispatch('gameevent', {action, path: selected.path}, {cancelable: true})) {
									// @ts-ignore
									selected[action]();
									if (dispatch('uievent', {hovered: selected.path, selected: null}, {cancelable: true})) {
										selected.usermode = UserMode.Hover;
										hovered = selected;
									 } else
										selected.usermode = UserMode.None;
									selected = null;
									$game = $game;
								}
							}}>
							{action}
						</button>
					</li>
				{/if}
			{/each}
			{#if selected instanceof Collection}
				<li class="w-full">
					<button
						class="w-full hover:bg-gray-200 p-1 rounded-lg"
						on:click={(e) => {
							let pos = canvas(e);
							if (dispatch('gameevent', {action: 'draw', pos, args: [selected.path]}, {cancelable: true})) {
								let drew = $game.draw(selected);
								drew.pos = pos;

								if (dispatch('uievent', {hovered: selected.path, selected: null}, {cancelable: true})) {
									selected.usermode = UserMode.Hover;
									hovered = selected;
								} else
									selected.usermode = UserMode.None;
								selected = null;
								$game = $game;
							}
						}}>
						draw
					</button>
				</li>
			{/if}
		</ul>
	</nav>
{/if}

<div class="viewport relative overflow-hidden w-full h-full"
	bind:this="{viewport}"
	on:wheel|preventDefault="{(e) => zoom(e, e.deltaY / 1000)}"
	on:pointerdown|preventDefault="{(e) => paning = true}"
>
	<div class="canvas absolute origin-top-left" style="transform: scale({camera.z}) translate({camera.x}px,{camera.y}px)" use:apply_textfit>
		<div class="flex flex-wrap gap-1" style="width:96rem">
			{#each $game.state as component(component.path)}
				<Token
					on:pointerdown="{(e) => {
						if (e.button === 0) {
							let bounds = e.target.getBoundingClientRect();
							let dragoffset = {x: (e.clientX - bounds.x) / camera.z, y: (e.clientY - bounds.y) / camera.z};
							if (dispatch('uievent', {hovered: null, selected: component.path, dragoffset}, {cancelable: true})) {
								component.usermode = UserMode.Drag;
								component.usercolor = $user.color;
								selected = component;
								selected.dragoffset = dragoffset;
								hovered = null;
							}
							e.preventDefault();
							e.stopPropagation();
						}
					}}"
					on:contextmenu="{(e) => {
						if (dispatch('uievent', {hovered: null, selected: component.path}, {cancelable: true})) {
							component.usermode = UserMode.Menu;
							component.usercolor = $user.color;
							selected = component;
							selected.menu = {x: e.clientX, y: e.clientY};
							hovered = null;
						}
						e.preventDefault();
						e.stopPropagation();
					}}"
					token="{component}"
				/>
			{/each}
		</div>
	</div>
	<div class="overlay absolute right-1 bottom-1 shadow-md bg-slate-100 p-1" >
	</div>
</div>

<svelte:window on:pointermove|passive="{onpointermove}" on:pointerup|passive="{onpointerup}" />
