import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import type { Plugin } from 'vite';
import fs from 'fs';
import JSON5 from 'json5';

function* walk(dir: string, prefix: string = ""): Generator<string> {
	const files = fs.readdirSync(dir, {withFileTypes: true});
    for (const d of files) {
        if (d.isDirectory())
			yield* walk(path.join(dir, d.name), path.join(prefix, d.name));
        else if (d.isFile())
			yield path.join(prefix, d.name);
    }
}

function MergeGamesPlugin(root: string): Plugin {
	const dirs:string[] = [];
	return {
		name: 'merge-games-plugin',
		buildStart() {
			const files = fs.readdirSync(root, {withFileTypes: true});
			for (const d of files) {
				if (d.isDirectory()) {
					const gamedir = path.join(root, d.name);
					const game:any = {};
					dirs.push(gamedir);

					for (let p of walk(gamedir)) {
						let data = fs.readFileSync(path.join(gamedir, p), { encoding: 'utf8' });
						if (p.match(/\.jsonc?$/)) {
							p = p.replace(/\.jsonc?$/, '');
							data = JSON5.parse(data);
						}
						game[p.replaceAll('/', '.')] = data;
					}

					fs.writeFileSync(gamedir.replace(/\/?$/, '.json'), JSON.stringify(game, null, 2));

					console.log('Merged game:', d.name);
				}
			}
		},
		handleHotUpdate({ file, server }) {
			if (dirs.some((v) => file.startsWith(v + '/'))) {
				server.restart();
			}
		},
	};
}

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	build: {
		rollupOptions: {external: /\/static\/games\//}
	},
	plugins: [
		MergeGamesPlugin(__dirname + '/static/games/'),
		sveltekit(),
	],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./tests/setup.ts']
	}
});
