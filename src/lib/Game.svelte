<script lang="ts">
	import { type Point, Lock } from "./types.js";
	import { type Writable, writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';

	import Token from "./Token.svelte";
	import { textfit } from "./utils.js";
	import { Collection,Stack } from "./collections.js";
	import { type Component } from "./components.js";
	import { user } from "./stores.js";
	import type Game from "./Game.js";

	export let game:Game;

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

	let selected: Component | undefined = undefined;
	let hovered: Component | undefined = undefined;
	enum UiMode { None = 0, Drag, Menu, Pan, Choose };
	let uimode = UiMode.None;


	function onpointermove (e:MouseEvent) {
		if (uimode == UiMode.Pan)
			pan({x: -e.movementX, y: -e.movementY});
		else if (!selected || uimode != UiMode.Menu) {
			let p = canvas(e);
			let newhovered;
			for (let component of game.state.toReversed()) {
				if (component != selected && component.pos && component.width && component.height && p.x > component.pos.x && p.x < component.pos.x + component.width && p.y > component.pos.y && p.y < component.pos.y + component.height) {
					newhovered = component;
					break;
				}
			}

			if (hovered != newhovered) {
				if (hovered && hovered.lock == Lock.Hover) {
					hovered.lock = Lock.None;
					dispatch('lock', {path: hovered.path, lock: Lock.None});
				}
				hovered = undefined;
				if (newhovered && newhovered.lock == Lock.None && dispatch('lock', {path: newhovered.path, lock: Lock.Hover}, {cancelable: true})) {
					hovered = newhovered;
					hovered.lock = Lock.Hover;
					hovered.usercolor = $user.color;
				}
			}
			if (selected && uimode == UiMode.Drag && selected.dragoffset)
				selected.pos = {x: p.x - selected.dragoffset.x, y: p.y - selected.dragoffset.y};
			game = game;
		}
	}

	let stackcount = 0;
	function onpointerup(e:MouseEvent) {
		if (uimode == UiMode.Pan)
			uimode = UiMode.None;
		else if (selected && uimode == UiMode.Drag && !hovered) {
			hovered = selected;
			hovered.lock = Lock.Hover;
			dispatch('lock', {path: hovered.path, lock: Lock.Hover});
			selected = undefined;
			uimode = UiMode.None;
			game = game;
		} else if (selected && uimode == UiMode.Drag && hovered) {
			selected.lock = Lock.None;
			dispatch('lock', {path: selected.path, lock: Lock.None})
			let oldhovered = hovered;
			let newhovered = game.drop(selected, hovered);
			if (newhovered && newhovered.lock == Lock.None && dispatch('lock', {path: newhovered.path, lock: Lock.Hover}, {cancelable: true})) {
				hovered = newhovered;
				hovered.lock = Lock.Hover;
				hovered.usercolor = $user.color;
			}

			dispatch('gameevent', {action: 'drop', hash: game.hash(), pos: oldhovered ? undefined : selected.pos, args: [selected.path, oldhovered?.path]});
			selected = undefined;
			uimode = UiMode.None;
			game = game;
		}
	}

	function draw_event(e:MouseEvent, what:any = null) {
		let pos = {x: selected.pos.x + selected.width + 20, y: selected.pos.y};
		if (typeof what === "number") {
			for (let i = 0; i < what; i++) {
				let drew = game.draw(selected);
				drew.pos = {x: pos.x, y: pos.y};
				dispatch('gameevent', {action: 'draw', hash: game.hash(), pos: drew.pos, args: [selected.path]});
				pos.x += drew.width + 5;
			}
		} else {
			let drew = game.draw(selected, what);
			drew.pos = pos;
			dispatch('gameevent', {action: 'draw', hash: game.hash(), pos: drew.pos, args: [selected.path, what?.path]});
		}
		// in theory this should never be cancelled as the token was selected before, but this way all lock events except Lock.None are cancelable
		if (dispatch('lock', {path: selected.path, lock: Lock.Hover}, {cancelable: true})) {
			selected.lock = Lock.Hover;
			hovered = selected;
		} else {
			dispatch('lock', {path: selected.path, lock: Lock.None});
			selected.lock = Lock.None;
		}
		selected = undefined;
		uimode = UiMode.None;
		game = game;
	}

	function drag_event(e:MouseEvent, component:Component) {
		component.lock = Lock.Select;
		component.usercolor = $user.color;
		uimode = UiMode.Drag;
		selected = component;
		if (hovered == selected)
			hovered = undefined;
	}

	let choosedialog;
</script>

<dialog bind:this={choosedialog} on:click="{(e) => choosedialog.close()}" class="p-4 rounded-lg bg-white shadow-sm" >
	<!-- Modal content -->
	<div class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700 flex flex-wrap gap-1">
		{#if selected && selected instanceof Collection && uimode == UiMode.Choose}
			{#each selected.values() as component(component.path)}
				<div on:pointerdown="{(e) => {
					if (e.button === 0) {
						let bounds = e.target.getBoundingClientRect();
						let dragoffset = {x: (e.clientX - bounds.x) / camera.z, y: (e.clientY - bounds.y) / camera.z};
						if (dispatch('lock', {path: component.path, lock: Lock.Select, dragoffset}, {cancelable: true})) {
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
					{@html component.front}
				</div>
			{/each}
		{/if}
	</div>
</dialog>

{#if selected && selected.menu && uimode == UiMode.Menu}
	<nav class="border-2 p-1 border-gray-700 rounded-lg bg-white z-50" style="position: absolute; top:{selected.menu.y - 10}px; left:{selected.menu.x - 10}px" on:pointerleave="{e => selected = undefined}">
		<ul>
			{#each ['flip', 'shuffle'] as action}
				{#if selected && action in selected}
					<li class="w-full">
						<button
							class="w-full hover:bg-gray-200 p-1 rounded-lg"
							on:click={(e) => {
								if (selected) {
									// @ts-ignore
									selected[action]();
									if (dispatch('lock', {path: selected.path, lock: Lock.Hover}, {cancelable: true})) {
										selected.lock = Lock.Hover;
										selected.usercolor = $user.color;
										hovered = selected;
									} else if (selected.lock != Lock.None) {
										dispatch('lock', {path: hovered.path, lock: Lock.None});
										selected.lock = Lock.None;
									}
									dispatch('gameevent', {action, hash: game.hash(), path: selected.path});
									selected = undefined;
									uimode = UiMode.None;
									game = game;
								}
							}}>
							{action}
						</button>
					</li>
				{/if}
			{/each}
			{#if selected instanceof Collection}
				<li class="w-full dropdown">
					<button
						class="w-full hover:bg-gray-200 p-1 rounded-lg relativ"
						on:click={(e) => {
							if (dispatch('lock', {path: selected.path, lock: Lock.Hover}, {cancelable: true}))
								draw_event(e);
							e.preventDefault();
							e.stopPropagation();
						}}>
						draw
					</button>
					<ul class="dropdown-content absolute left-full border-2 p-1 border-gray-700 rounded-lg bg-white z-50">
						{#each Array(Math.min(10, selected.length())).keys() as idx}
							<li><button
								class="w-full hover:bg-gray-200 p-1 rounded-lg"
								on:click={(e) => {
									if (dispatch('lock', {path: selected.path, lock: Lock.Select}, {cancelable: true}))
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
							uimode = UiMode.Choose;
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
	on:pointerdown|preventDefault="{(e) => uimode = UiMode.Pan}"
	on:pointermove|passive="{onpointermove}" on:pointerup|passive="{onpointerup}" 
>
	<div class="canvas absolute origin-top-left" style="transform: scale({camera.z}) translate({camera.x}px,{camera.y}px)" use:apply_textfit>
		<div class="flex flex-wrap gap-1" style="width:96rem">
			{#each game.state as component(component.path)}
				<Token
					on:pointerdown="{(e) => {
						if (e.button === 0) {
							let bounds = e.target.getBoundingClientRect();
							let dragoffset = {x: (e.clientX - bounds.x) / camera.z, y: (e.clientY - bounds.y) / camera.z};
							if (dispatch('lock', {path: component.path, lock: Lock.Select, dragoffset}, {cancelable: true})) {
								component.dragoffset = dragoffset;
								drag_event(e, component);
							}
							e.preventDefault();
							e.stopPropagation();
						}
					}}"
					on:contextmenu="{(e) => {
						if (dispatch('lock', {path: component.path, lock: Lock.Select}, {cancelable: true})) {
							component.lock = Lock.Select;
							component.usercolor = $user.color;
							uimode = UiMode.Menu;
							selected = component;
							selected.menu = {x: e.clientX, y: e.clientY};
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
