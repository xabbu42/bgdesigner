import JSON5 from "json5"
import Game from "$lib/Game.js"
import { writable, get } from 'svelte/store';

let allgames = writable({});

export async function load({ fetch, params }) {
	if (!get(allgames)[params.name]) {
		let response = await fetch("/games/" + params.name);
		let data = JSON5.parse(await response.text());
		get(allgames)[params.name] = writable(new Game(params.name, data));
	}
	return {game: get(allgames)[params.name]};
}
