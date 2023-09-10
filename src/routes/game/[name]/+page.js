import {parse} from "jsonc-parser"

export async function load({ fetch, params }) {
	let response = await fetch("/games/" + params.name);
	let game = parse(await response.text());
	return game;
}
