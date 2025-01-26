import Ably from 'ably';
import { get } from 'svelte/store';
import { user } from '$lib/stores';

export let ably;
export function init_ably(key) {
	console.log("init ably");
	let u = get(user);
	ably = new Ably.Realtime({key, clientId: u.name});
}
