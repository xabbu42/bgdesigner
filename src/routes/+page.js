
export async function load({ fetch, params }) {
	let name = 'jass.json';
	let response = await fetch("/games/" + name);
	let game = await response.json();
	return game;
}
