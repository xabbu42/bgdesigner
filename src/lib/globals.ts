import { writable, get } from 'svelte/store';
import Ably from 'ably';

export const user    = writable({name: 'SinglePlayer', color: "hsl(240, 70%, 70%)"});
export const members = writable([]);
export let ably;
export function init_ably(key) {
	console.log("init ably");
	let u = get(user);
	ably = new Ably.Realtime({key, clientId: u.name});
	const channel = ably.channels.get(key);
	channel.presence.enter({user: u});
	user.subscribe((v) => channel.presence.update(v));
	channel.presence.subscribe(async (m) => members.set(await channel.presence.get()));
}
