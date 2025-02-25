import type { ClientInit } from '@sveltejs/kit';
import { init_ably } from '$lib/init_ably.js';
import * as env from '$env/static/public';

export const init: ClientInit = async () => {
	if ('PUBLIC_ABLY_KEY' in env)
		init_ably(env.PUBLIC_ABLY_KEY);
};
