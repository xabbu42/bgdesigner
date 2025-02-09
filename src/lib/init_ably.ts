import Ably from 'ably';
import { get } from 'svelte/store';
import { user } from '$lib/stores';

import rug from 'random-username-generator';
import { hashcolor } from '$lib/utils';

export let ably;
export function init_ably(key) {
	console.log("init ably");
	let name = sessionStorage.getItem('username') || rug.generate();
	let u = {name, color: hashcolor(name)};
	user.set(u);
	ably = new Ably.Realtime({key, clientId: u.name});
}
