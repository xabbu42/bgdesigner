import JSON5 from "json5"

export async function load({ fetch, params }) {
	let response = await fetch("/games/" + params.name);
	let game = JSON5.parse(await response.text());
	return game;
}
