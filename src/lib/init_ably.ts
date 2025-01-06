import Ably from 'ably';
import { get } from 'svelte/store';
import { user, members } from '$lib/stores';

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
