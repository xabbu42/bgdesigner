<script lang="ts">
	import { type Point, type Lock } from "./types.js";
	import type { Component } from "./components.js";
	import { type Writable, writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';

	import Token from "./Token.svelte";
	import { textfit } from "./utils.js";
	import { Collection, Stack } from "./collections.js";
	import { user } from "./stores.js";
	import type Game from "./Game.js";

	export let game: Game;

	interface GameEvent {
		action: string;
		hash: number;
		pos?: Point;
		path?: string;
		args?: any[];
	}

	interface LockEvent {
		path: string;
		lock: Lock;
		dragoffset?: Point;
	}

	const dispatch = createEventDispatcher<{
		gameevent: GameEvent;
		lock: LockEvent;
	}>();

	interface Camera {
		x: number;
		y: number;
		z: number;
	}

	let camera: Camera = {x: 0, y: 0, z: 1};
	let viewport: HTMLElement;

	export function canvas(p: Point, c: Camera = camera): Point {
		const rect = viewport.getBoundingClientRect();
		return { x: (p.x - rect.left) / c.z - c.x, y: (p.y - rect.top) / c.z - c.y };
	}

	export function screen(p: Point, c: Camera = camera): Point {
		const rect = viewport.getBoundingClientRect();
		return { x: (p.x + c.x) * c.z + rect.left, y: (p.y + c.y) * c.z + rect.top };
	}

	function zoom(point: Point, dz: number): void {
		const z = camera.z - dz * camera.z
		const p1 = canvas(point)
		const p2 = canvas(point, { ...camera, z: z})
		camera = {
			x: camera.x + (p2.x - p1.x),
			y: camera.y + (p2.y - p1.y),
			z: z,
		}
	}

	function pan(d: Point): void {
		camera = {
			x: camera.x - d.x / camera.z,
			y: camera.y - d.y / camera.z,
			z: camera.z,
		}
	}

	function apply_textfit(element: HTMLElement): void {
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

	let selected: Component[] = [];
	let hovered: Component | undefined = undefined;
	type UiMode = 'None' | 'Drag' | 'Menu' | 'Pan' | 'Choose';
	let uimode: UiMode = 'None';


	function onpointermove(e: MouseEvent): void {
		if (uimode == 'Pan')
			pan({x: -e.movementX, y: -e.movementY});
		else if (selected.length === 0 || uimode != 'Menu') {
			const p = canvas(e);
			let newhovered: Component | undefined;
			for (const component of game.state.toReversed()) {
				if (!selected.includes(component) && component.pos && component.width && component.height && p.x > component.pos.x && p.x < component.pos.x + component.width && p.y > component.pos.y && p.y < component.pos.y + component.height) {
					newhovered = component;
					break;
				}
			}

			if (hovered != newhovered) {
				if (hovered && hovered.lock == 'Hover') {
					hovered.lock = 'None';
					dispatch('lock', {path: hovered.path, lock: 'None'});
				}
				hovered = undefined;
				if (newhovered && newhovered.lock == 'None' && dispatch('lock', {path: newhovered.path, lock: 'Hover'}, {cancelable: true})) {
					hovered = newhovered;
					hovered.lock = 'Hover';
					hovered.usercolor = $user.color;
				}
			}
			if (selected.length > 0 && uimode == 'Drag' && selected[0].dragoffset)
				selected[0].pos = {x: p.x - selected[0].dragoffset.x, y: p.y - selected[0].dragoffset.y};
			game = game;
		}
	}

	let stackcount: number = 0;
	function onpointerup(e: MouseEvent): void {
		if (uimode == 'Pan')
			uimode = 'None';
		else if (selected.length > 0 && uimode == 'Drag' && !hovered) {
			hovered = selected[0];
			hovered.lock = 'Hover';
			dispatch('lock', {path: hovered.path, lock: 'Hover'});
			selected = [];
			uimode = 'None';
			game = game;
		} else if (selected.length > 0 && uimode == 'Drag' && hovered) {
			selected[0].lock = 'None';
			dispatch('lock', {path: selected[0].path, lock: 'None'})
			const oldhovered = hovered;
			const newhovered = game.drop(selected[0], hovered);
			if (newhovered && newhovered.lock == 'None' && dispatch('lock', {path: newhovered.path, lock: 'Hover'}, {cancelable: true})) {
				hovered = newhovered;
				hovered.lock = 'Hover';
				hovered.usercolor = $user.color;
			}

			dispatch('gameevent', {action: 'drop', hash: game.hash(), pos: oldhovered ? undefined : selected[0].pos, args: [selected[0].path, oldhovered?.path]});
			selected = [];
			uimode = 'None';
			game = game;
		}
	}

	function draw_event(e: MouseEvent, what: Component | number | null = null): void {
		if (selected.length === 0 || !selected[0].pos || !selected[0].width || !(selected[0] instanceof Collection)) return;

		let pos: Point = {x: selected[0].pos.x + selected[0].width + 20, y: selected[0].pos.y};
		if (typeof what === "number") {
			for (let i = 0; i < what; i++) {
				const drew = game.draw(selected[0]);
				drew.pos = {x: pos.x, y: pos.y};
				dispatch('gameevent', {action: 'draw', hash: game.hash(), pos: drew.pos, args: [selected[0].path]});
				pos.x += (drew.width || 0) + 5;
			}
		} else {
			const drew = game.draw(selected[0], what);
			drew.pos = pos;
			dispatch('gameevent', {action: 'draw', hash: game.hash(), pos: drew.pos, args: [selected[0].path, what?.path]});
		}
		// in theory this should never be cancelled as the token was selected before, but this way all lock events except 'None' are cancelable
		if (dispatch('lock', {path: selected[0].path, lock: 'Hover'}, {cancelable: true})) {
			selected[0].lock = 'Hover';
			hovered = selected[0];
		} else {
			dispatch('lock', {path: selected[0].path, lock: 'None'});
			selected[0].lock = 'None';
		}
		selected = [];
		uimode = 'None';
		game = game;
	}

	function drag_event(e: MouseEvent, component: Component): void {
		component.lock = 'Select';
		component.usercolor = $user.color;
		uimode = 'Drag';
		selected = [component];
		if (hovered == component)
			hovered = undefined;
	}

	let choosedialog: HTMLDialogElement;
</script>

<dialog bind:this={choosedialog} on:click="{(e) => choosedialog.close()}" class="p-4 rounded-lg bg-white shadow-sm" >
	<!-- Modal content -->
	<div class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700 flex flex-wrap gap-1">
		{#if selected.length > 0 && selected[0] instanceof Collection && uimode == 'Choose'}
			{#each selected[0].values() as component(component.path)}
				<div on:pointerdown="{(e) => {
					if (e.button === 0) {
						let bounds = e.target.getBoundingClientRect();
						let dragoffset = {x: (e.clientX - bounds.x) / camera.z, y: (e.clientY - bounds.y) / camera.z};
						if (dispatch('lock', {path: component.path, lock: 'Select', dragoffset}, {cancelable: true})) {
							draw_event(e, component);
							component.dragoffset = dragoffset;
							let p = canvas(e);
							component.pos = {x: p.x - component.dragoffset.x, y: p.y - component.dragoffset.y};
							drag_event(e, component);
							choosedialog.close();
						}
						e.preventDefault();
						e.stopPropagation();
					}
				}}">
					{@html component.front || component.toString()}
				</div>
			{/each}
		{/if}
	</div>
</dialog>

{#if selected.length > 0 && selected[0].menu && uimode == 'Menu'}
	<nav class="border-2 p-1 border-gray-700 rounded-lg bg-white z-50" style="position: absolute; top:{selected[0].menu.y - 10}px; left:{selected[0].menu.x - 10}px" on:pointerleave="{e => selected = []}">
		<ul>
			{#each ['flip', 'shuffle'] as action}
				{#if selected.length > 0 && action in selected[0]}
					<li class="w-full">
						<button
							class="w-full hover:bg-gray-200 p-1 rounded-lg"
							on:click={(e) => {
								if (selected.length > 0) {
									// @ts-ignore
									selected[0][action]();
									if (dispatch('lock', {path: selected[0].path, lock: 'Hover'}, {cancelable: true})) {
										selected[0].lock = 'Hover';
										selected[0].usercolor = $user.color;
										hovered = selected[0];
									} else if (selected[0].lock != 'None' && hovered) {
										dispatch('lock', {path: hovered.path, lock: 'None'});
										selected[0].lock = 'None';
									}
									dispatch('gameevent', {action, hash: game.hash(), path: selected[0].path});
									selected = [];
									uimode = 'None';
									game = game;
								}
							}}>
							{action}
						</button>
					</li>
				{/if}
			{/each}
			{#if selected.length > 0 && selected[0] instanceof Collection}
				<li class="w-full dropdown">
					<button
						class="w-full hover:bg-gray-200 p-1 rounded-lg relativ"
						on:click={(e) => {
							if (selected.length > 0 && dispatch('lock', {path: selected[0].path, lock: 'Hover'}, {cancelable: true}))
								draw_event(e);
							e.preventDefault();
							e.stopPropagation();
						}}>
						draw
					</button>
					<ul class="dropdown-content absolute left-full border-2 p-1 border-gray-700 rounded-lg bg-white z-50">
						{#each Array(Math.min(10, selected[0].length())).keys() as idx}
							<li><button
								class="w-full hover:bg-gray-200 p-1 rounded-lg"
								on:click={(e) => {
									if (selected.length > 0 && dispatch('lock', {path: selected[0].path, lock: 'Select'}, {cancelable: true}))
										 draw_event(e, idx + 1);
									e.preventDefault();
									e.stopPropagation();
								}}>
								{idx + 1}
							</button></li>
						{/each}
					</ul>
				</li>
				<li class="w-full">
					<button
						class="w-full hover:bg-gray-200 p-1 rounded-lg"
						on:click={(e) => {
							uimode = 'Choose';
							choosedialog.showModal();
						}}>
						choose
					</button>
				</li>
			{/if}
		</ul>
	</nav>
{/if}

<div class="viewport relative overflow-hidden w-full h-full select-none"
	bind:this="{viewport}"
	on:wheel|preventDefault="{(e) => zoom(e, e.deltaY / 1000)}"
	on:pointerdown|preventDefault="{(e) => uimode = 'Pan'}"
	on:pointermove="{onpointermove}" on:pointerup="{onpointerup}"
>
	<div class="canvas absolute origin-top-left" style="transform: scale({camera.z}) translate({camera.x}px,{camera.y}px)" use:apply_textfit>
		<div class="flex flex-wrap gap-1" style="width:96rem">
			{#each game.state as component(component.path)}
				<Token
					on:pointerdown="{(e) => {
						if (e.button === 0) {
							let bounds = e.target.getBoundingClientRect();
							let dragoffset = {x: (e.clientX - bounds.x) / camera.z, y: (e.clientY - bounds.y) / camera.z};
							if (dispatch('lock', {path: component.path, lock: 'Select', dragoffset}, {cancelable: true})) {
								component.dragoffset = dragoffset;
								drag_event(e, component);
							}
							e.preventDefault();
							e.stopPropagation();
						}
					}}"
					on:contextmenu="{(e) => {
						if (dispatch('lock', {path: component.path, lock: 'Select'}, {cancelable: true})) {
							component.lock = 'Select';
							component.usercolor = $user.color;
							uimode = 'Menu';
							selected = [component];
							component.menu = {x: e.clientX, y: e.clientY};
							hovered = undefined;
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

<style>

.dropdown-content {
	transform: rotateX(-90deg) translateX(-25%) translateY(-50%);
	transform-origin: top center;
	opacity: 0.3;
	visibility: hidden;
	transition: 280ms all ease-out;
}

.dropdown:hover .dropdown-content {
	opacity: 1;
	transform: rotateX(0) translateX(-25%) translateY(-50%);
	visibility: visible;
}
</style>
