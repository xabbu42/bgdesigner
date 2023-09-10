import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { Plugin } from 'vite';
import fs from 'fs';

function* walk(dir: string, prefix: string = "") {
	const files = fs.readdirSync(dir, {withFileTypes: true});
    for (const d of files) {
        if (d.isDirectory())
			yield* walk(path.join(dir, d.name), path.join(prefix, d.name));
        else if (d.isFile())
			yield path.join(prefix, d.name);
    }
}

function MergeGamesPlugin(root: string): Plugin {
	const dirs = [];
	return {
		name: 'merge-games-plugin',
		buildStart() {
			const files = fs.readdirSync(root, {withFileTypes: true});
			for (const d of files) {
				if (d.isDirectory()) {
					const gamedir = path.join(root, d.name);
					const game = {};
					dirs.push(gamedir);

					for (const p of walk(gamedir)) {
						const data = fs.readFileSync(path.join(gamedir, p), { encoding: 'utf8' });
						game[p.replace(/\.json$/, '').replaceAll('/', '.')] = p.endsWith('.json') ? JSON.parse(data) : data;
					}

					fs.writeFileSync(gamedir.replace(/\/?$/, '.json'), JSON.stringify(game, null, 2));

					console.log('Merged game:', d.name);
				}
			}
		},
		handleHotUpdate({ file, server }) {
			if (dirs.some((v) => file.startsWith(v))) {
				server.restart();
			}
		},
	};
}

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		MergeGamesPlugin(__dirname + '/static/games/'),
		sveltekit(),
	],
});
