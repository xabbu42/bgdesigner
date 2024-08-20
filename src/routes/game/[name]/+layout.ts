import JSON5 from "json5"
import Game from "$lib/Game.js"

export async function load({ fetch, params }) {
	let response = await fetch("/games/" + params.name);
	let data = JSON5.parse(await response.text());
	return {game: new Game(params.name, data)};
}
