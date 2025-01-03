import type { ClientInit } from '@sveltejs/kit';
import { writable } from 'svelte/store';

import Ably from 'ably';
import rug from 'random-username-generator';

import { hashcolor } from '$lib/utils';
import * as env from '$env/static/public';

let name = rug.generate();
export const user = writable({name, color: hashcolor(name)});
export const members = writable([]);
export let ably;

export const init: ClientInit = async () => {
	name = sessionStorage.getItem('username') || name;
	const u = {name, color: hashcolor(name)};
	user.set(u);

	if ('PUBLIC_ABLY_KEY' in env) {
		console.log('init ably');
		ably = new Ably.Realtime({key: env.PUBLIC_ABLY_KEY, clientId: u.name});
		const channel = ably.channels.get('bgdesigner');
		channel.presence.enter({user:u});
		user.subscribe((v) => channel.presence.update(v));
		channel.presence.subscribe(async (m) => members.set(await channel.presence.get()));
	};
};
