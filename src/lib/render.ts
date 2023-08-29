const presets = {
	"@cards": "<div class=\"{{color}} card relative\"><div class=\"absolute top-4 left-4\">{{text}}</div><h1 class=\"text-6xl\">{{text}}</h1><div class=\"absolute bottom-4 right-4 rotate-180\">{{text}}</div></div>",
	"@tokens": "<div class=\"token\">{{symbol}}</div>"
}

export function* allpathes(obj: object, path: string[] = []) {
    for (let key in obj) {
        const newpath = path.concat(key);
        yield newpath.join('.');
        if (obj[key] !== null && typeof(obj[key])=="object")
            yield* allpathes(obj[key], newpath);
    }
}

export function* alltemplates(game: object) {
	for (let obj of [game, presets]) {
		for (let v of allpathes(obj))
			if (v.startsWith('@'))
				yield v;
	}
}

function* allstrings(obj: object) {
    for (let key in obj) {
		switch (typeof(obj[key])) {
			case "object":
				yield* allstrings(obj[key]);
				break;
			case "string":
				yield obj[key];
				break;
		}
    }
}

function gettempl(obj: object, path: string) {
	let templkeys = [...allpathes(obj)].filter((v) => v.startsWith('@') && path.startsWith(v.substring(1))).sort((a, b) => a.length - b.length);
	return templkeys.length > 0 ? getpath(obj, templkeys[0]) : undefined;
}

export function getpath(obj: object, path: string) {
	let value = obj;
	let prefix = '';
	for (let part of path.split('.')) {
		if (prefix + part in value) {
			value = value[prefix + part];
			prefix = '';
		} else
			prefix += part + '.';
	}
	return prefix ? value[prefix] : value;
}

function repls(value: any, data: object, game: object) {
	const collections = {};
	if (typeof value !== 'object')
		value = {value};
	for (let str of allstrings(value)) {
		for (let expr of str.matchAll(/{{([^:]+?)}}/g)) {
			if (!collections[expr[1]]) {
				let v = render(expr[1], game, data);
				collections[expr[1]] = Array.isArray(v) ? v : [v];
			}
		}
	}
	const variables = Object.keys(collections);
	const allrepls = Object.values(collections).reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), ['']);
	const all = [];
	for (let repls of allrepls) {
		const single = {};
		for (let i = 0; i < variables.length; i++)
			single[variables[i]] = repls[i+1];
		all.push(single);
	}
	return all;
}

export function render(path: string, game: object, data: object = {}) {

	if (path in data)
		return data[path];

	let icon = path.match(/^([\w-]+:[\w-]+)\s*(.*)$/);
	if (icon)
		return `<iconify-icon inline icon="${icon[1]}" style="${icon[2]}"></iconify-icon>`;

	let regexp = new RegExp('(^|\\.)' + path.replaceAll('.', '\.').replaceAll('*', '.*') + '$');
	let pathes = [...allpathes(game)].filter((v) => regexp.test(v));
	if (path.includes('*')) {
		let result = [];
		for (let p of pathes)
			result.push(render(p, game, data));
		return result;
	} else if (pathes.length == 0) {
		throw `Unknown path ${path}`
	} else if (pathes.length > 1) {
		throw `Ambigious path ${path}: ${pathes.join(',')}`;
	}

	path = pathes[0];
	let value = getpath(game, path);

	switch (typeof value) {
		case "string":
			const result = repls(value, data, game).map((repl) => value.replaceAll(/{{(.+?)}}/g, (_,expr) => repl[expr] || render(expr, game, data)));
			return result.length == 1 ? result[0] : result;
			break;

		case "object":
			if (Array.isArray(value)) {
				return Array.from(value.keys()).map((v) => render(path + '.' + v, game, data));
			} else {
				let templ = gettempl(game, path) || gettempl(presets, path);
				if (templ) {
					const result = [];
					const subdata = {};
					for (let repl of repls(value, data, game)) {
						Object.assign(subdata, repl);
						for (let k in value)
							subdata[k] = render(path + '.' + k, game, subdata);
						result.push(templ.replaceAll(/{{(.+?)}}/g, (_,expr) => subdata[expr]));
					}
					return result;
				} else {
					return  Object.fromEntries(Object.keys(value).map((v) => [v, render(path + '.' + v, game, data)]));
				}
			}
			break;

		default:
			return value;
			break;
	}
}
