import Token from "./Token.js";

const types = {
	"Token": Token
}

const presets = {
	"@cards": {
		"front": "<div class=\"{{class}} card relative\"><div class=\"absolute top-4 left-4 bottom-4 right-4\">{{background}}</div><div class=\"absolute top-4 left-4\">{{text}}</div><div class=\"center z-10\">{{text}}</div><div class=\"absolute bottom-4 right-4 rotate-180\">{{text}}</div></div>",
		"back": "<div class=\"{{class}} card\"></div>",
		"type": "Token"
	},
	"@tokens": {
		"html" : "<div class=\"{{class}} token\">{{symbol}}</div>",
		"type" : "Token"
	}
}

const registry = {
	range: (g, d, a, b) => [...Array(b ? b - a + 1 : +a).keys()].map(i => i + (b ? +a : 1)),
	max: (g, d, p) => Math.max(...render(p, g, d)),
	min: (g, d, p) => Math.min(...render(p, g, d))
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
	const seen = {};
	for (let obj of [game, presets]) {
		for (let v of allpathes(obj)) {
			if (v.startsWith('@') && !seen[v]) {
				seen[v] = true;
				yield v;
			}
		}
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

function getannotations(obj: object, path: string) {
	let pathes = [...allpathes(obj)].filter((v) => v.startsWith('@') && path.startsWith(v.substring(1))).sort((a, b) => a.length - b.length);
	return pathes.map((p) => getpath(obj, p));
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

function to_collection(arg: any) {
	if (Array.isArray(arg))
		return {"type" : "dice", 'values': arg};
	else if (typeof arg === 'object' && 'values' in arg && 'type' in arg)
		return arg;
	else
		return {"type": "dice", 'values': [arg]};
}

function repls(value: any, data: object, game: object) {
	const collections = {};
	if (typeof value !== 'object')
		value = {value};
	for (let str of allstrings(value)) {
		for (let expr of str.matchAll(/{{([^:]+?)}}/g)) {
			if (!collections[expr[1]] && !value[expr[1]]) {
				collections[expr[1]] = to_collection(render(expr[1], game, data, false));
				collections[expr[1]].key = expr[1];
			}
		}
	}

	var result = Object.values(collections).reduce(
		(repls, add) => repls.flatMap(
			repl => add.values
				.filter(value => add.type != "bag" || repl.filter(other => other[0] == add.path && other[2] == value).length == 0)
				.map(value => [...repl, [add.path, add.key, value]])
		),
		[[]]
	);
	return result.map((repl) => Object.fromEntries(repl.map(v => v.slice(1))));
}

export function render(path: string, game: object, data: object = {}, strict:boolean = true) {

	if (path in data)
		return data[path];

	let icon = path.match(/^([\w-]+:[\w-]+)\s*(.*)$/);
	if (icon) {
		let params = icon[2].match(/\b[wh]-/) ? "width=none" : "inline";
		return `<iconify-icon ${params} icon="${icon[1]}" class="${icon[2]}"></iconify-icon>`;
	}

	let func = path.match(/^(\w+)\s+(.+)/);
	if (func && func[1] in registry) {
		return registry[func[1]](game, data, ...func[2].split(/\s+/));
	}

	let regexp = new RegExp('(^|\\.)' + path.replaceAll('.', '\.').replaceAll('*', '.*') + '$');
	let pathes = [...allpathes(game)].filter((v) => regexp.test(v));
	if (pathes.filter((v) => v == path).length > 0)
		pathes = [path];
	if (path.includes('*')) {
		let result = [];
		for (let p of pathes)
			result.push(render(p, game, data));
		return result;
	} else if (pathes.length == 0) {
		if (strict)
			throw `Unknown path ${path}`;
		else
			return '';
	} else if (pathes.length > 1) {
		if (strict)
			throw `Ambigious path ${path}: ${pathes.join(',')}`;
		else
			return '';
	}

	path = pathes[0];
	let value = getpath(game, path);

	switch (typeof value) {
		case "string":
			const single = value.match(/^{{([^}]*)}}$/);
			if (single)
				return render(single[1], game, data);
			const result = repls(value, data, game).map((repl) => value.replaceAll(/{{(.+?)}}/g, (_,expr) => repl[expr] || render(expr, game, data)));
			return result.length == 1 ? result[0] : result;
			break;

		case "object":
			if (Array.isArray(value)) {
				return Array.from(value.keys()).map((v) => render(path + '.' + v, game, data)).flat(Infinity);
			} else {
				for (let annotation of getannotations(presets, path).concat(getannotations(game, path))) {
					if (Array.isArray(annotation))
						value.values = annotation; //maybe useful for bags and dices?
					else if (typeof annotation == "object")
						Object.assign(value, annotation);
					else
						value.front = annotation; //hack for backwards compatibility with the great microgame
				}

				if (value.type) {
					const result = [];
					for (let repl of repls(value, data, game)) {
						const subdata = {};
						Object.assign(subdata, value);
						Object.assign(subdata, repl);
						for (let k in subdata)
							if (typeof subdata[k] == 'string')
								subdata[k] = subdata[k].replaceAll(/{{(.+?)}}/g, (_,expr) => subdata[expr] || render(expr, game, {}, false));
						result.push(new types[value.type] (subdata));
					}
					return result.flat(Infinity);
				} else {
					return Object.fromEntries(Object.keys(value).map((v) => [v, render(path + '.' + v, game, data)]).concat([['path', path]]));
				}
			}
			break;

		default:
			return value;
			break;
	}
}
