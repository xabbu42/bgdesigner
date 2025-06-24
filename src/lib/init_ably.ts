import Ably from 'ably';
import { get } from 'svelte/store';
import { user } from '$lib/stores.js';

import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { hashcolor } from '$lib/utils.js';

export let ably:Ably.Realtime;
export function init_ably(key:string) {
	console.log("init ably");
	let name = sessionStorage.getItem('username') || uniqueNamesGenerator({
		dictionaries: [adjectives, animals],
		separator: '',
		style: 'capital',
		length: 2
	});
	let u = {name, color: hashcolor(name)};
	user.set(u);
	user.subscribe((v) => sessionStorage.setItem('username', v.name));
	ably = new Ably.Realtime({key, clientId: u.name});
}
