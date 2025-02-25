import Ably from 'ably';
import { get } from 'svelte/store';
import { user } from '$lib/stores.js';

import rug from 'random-username-generator';
import { hashcolor } from '$lib/utils.js';

export let ably:Ably.Realtime;
export function init_ably(key:string) {
	console.log("init ably");
	let name = sessionStorage.getItem('username') || rug.generate();
	let u = {name, color: hashcolor(name)};
	user.set(u);
	user.subscribe((v) => sessionStorage.setItem('username', v.name));
	ably = new Ably.Realtime({key, clientId: u.name});
}
