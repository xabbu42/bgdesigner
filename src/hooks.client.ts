import type { ClientInit } from '@sveltejs/kit';

import rug from 'random-username-generator';

import { hashcolor } from '$lib/utils';
import { user, init_ably } from '$lib/globals';
import * as env from '$env/static/public';

export const init: ClientInit = async () => {
	let name = sessionStorage.getItem('username') || rug.generate();
	let u = {name, color: hashcolor(name)};
	user.set(u);
	if ('PUBLIC_ABLY_KEY' in env)
		init_ably(env.PUBLIC_ABLY_KEY);
};
