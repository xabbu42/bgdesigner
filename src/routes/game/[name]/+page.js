
export async function load({ fetch, params }) {
	let response = await fetch("/games/" + params.name);
	let game = await response.json();
	return game;
}
