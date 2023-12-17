import type Collection from "./types.ts"
import Token from "./Token.js";
import Bag from "./Bag.js";
import Dice from "./Dice.js";

function* allpathes(obj: object, path: string[] = []) {
	for (let key in obj) {
		const newpath = path.concat(key);
		yield newpath.join('.');
		if (obj[key] !== null && typeof(obj[key])=="object")
			yield* allpathes(obj[key], newpath);
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

function getpath(obj: object, path: string) {
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

function is_collection(arg: any) : arg is Collection {
	return typeof arg == "object" && arg.values !== undefined && arg.draw !== undefined;
}

function to_collection(path: string, arg: any) {
	if (is_collection(arg))
		return arg;
	else if (Array.isArray(arg))
		return new Dice (path, {"values": arg});
	else
		return new Dice (path, {"values": [arg]});
}

export default class Game {

	types:object = {
		"Token": Token,
		"Bag": Bag,
		"Dice": Dice,
	}

	presets:object = {
		"@cards": {
			"front": "<div class=\"{{class}} card relative\"><div class=\"absolute top-4 left-4 bottom-4 right-4\">{{background}}</div><div class=\"absolute top-4 left-4\">{{text}}</div><div class=\"center z-10\">{{text}}</div><div class=\"absolute bottom-4 right-4 rotate-180\">{{text}}</div></div>",
			"back": "<div class=\"{{class}} card\"></div>",
			"type": "Token",
			'class': '',
			'background': '',
			'text': '',
		},
		"@tokens": {
			"html" : "<div class=\"{{class}} token\">{{symbol}}</div>",
			"type" : "Token",
			'class' : '',
			'symbol': '',
		}
	}

	registry:object = {
		range: (g, d, a, b) => [...Array(b ? b - a + 1 : +a).keys()].map(i => i + (b ? +a : 1)),
		max: (g, d, p) => Math.max(...g.render(p, d)),
		min: (g, d, p) => Math.min(...g.render(p, d)),
		icon: (g, d, name, ...classes) =>
			`<iconify-icon ${classes.join(' ').match(/\b[wh]-/) ? "width=none" : "inline"} icon="${name}" class="${classes.join(' ')}"></iconify-icon>`
	}

	game:object = {};

	constructor(data:object) {
		this.game = data;
	}

	allcomponents() {
		let result = [];
		let pathes = [...allpathes(this.game), ...allpathes(this.presets)].filter(v => v.endsWith('.type')).map(v => v.slice(0,-5).replace(/^@/, ''));
		for (let path of new Set(pathes)) {
			if (this.getpath(path))
				result.push(this.render(path));
		}
		return result.flat(Infinity);
	}

	getpath(path: string) {
		return getpath(this.game, path);
	}

	repls(value: any, data: object) {
		const collections = {};
		if (typeof value !== 'object')
			value = {value};
		for (let str of allstrings(value)) {
			for (let expr of str.matchAll(/{{(%[^:]+?)}}/g)) {
				if (!collections[expr[1]] && !value[expr[1]])
					collections[expr[1]] = to_collection(expr[1], this.render(expr[1], data));
			}
		}

		function *combinations(comb:object, keys:[string], collections:object) {
			const [head, ...tail] = keys;
			for (let val of collections[head].values()) {
				comb[head] = collections[head].draw(val);
				if (tail.length > 0)
					yield* combinations(comb, tail, collections);
				else
					yield {...comb};
				collections[head].add(val);
			}
		}

		const keys = Object.keys(collections);
		return keys.length > 0 ? [...combinations({}, keys, collections)] : [{}];
	}

	annotations(path) {
		const annotations = {};
		for (let obj of [this.presets, this.game]) {
			let pathes = [...allpathes(obj)].filter((v) => v.startsWith('@') && path.startsWith(v.substring(1))).sort((a, b) => a.length - b.length);
			for (let annotation of pathes.map((p) => getpath(obj, p))) {
				if (Array.isArray(annotation))
					annotations.values = annotation; //maybe useful for bags and dices?
				else if (typeof annotation == "object") {
					Object.assign(annotations, annotation);
				} else
					annotations.front = annotation; //hack for backwards compatibility with the great microgame
			}
		}
		return annotations;
	}

	cache:object = {};

	render(path: string, data: object = null) {

		if (data && path in data)
			return data[path];

		let func = path.match(/^(%)?(\w+)\s+(.+)/);
		if (func) {
			if (!(func[2] in this.registry))
				throw `Unknown function ${func[2]}`;
			return this.registry[func[2]](this.game, data, ...func[3].split(/\s+/));
		}

		let regexp = new RegExp('(^|\\.)' + path.replace(/^%/, '').replaceAll('.', '\.').replaceAll('*', '.*') + '$');
		let pathes = [...allpathes(this.game)].filter((v) => regexp.test(v));
		if (pathes.filter((v) => v == path).length > 0)
			pathes = [path];
		if (path.includes('*')) {
			let result = [];
			for (let p of pathes)
				result.push(this.render(p, data));
			return result;
		} else if (pathes.length == 0) {
			throw `Unknown path ${path}`;
		} else if (pathes.length > 1) {
			throw `Ambigious path ${path}: ${pathes.join(',')}`;
		}

		path = pathes[0];
		if (data === null && this.cache[path])
			return this.cache[path];

		let value = this.getpath(path);
		let rendered;

		let render_string = (value, repl, data) => {
			const single = value.match(/^{{([^}]*)}}$/);
			return single ? repl[single[1]] ?? this.render(single[1], data)
			              : value.replaceAll(/{{(.+?)}}/g, (_,expr) => repl[expr] ?? this.render(expr, data));
		};

		if (typeof value == "string") {
			rendered = this.repls(value, data).map(repl => render_string(value, repl, data));
			rendered = rendered.length == 1 ? rendered[0] : rendered;

		} else if (Array.isArray(value)) {
			rendered = Array.from(value.keys()).map((v) => this.render(path + '.' + v, data)).flat(Infinity);

		} else if (typeof value == "object") {
			const annotations = this.annotations(path);
			for (let k in annotations)
				if (!(k in value))
					value[k] = annotations[k];

			const result = [];
			for (let repl of this.repls(value, data)) {
				const subdata = {...value, ...repl};
				for (let k in subdata)
					if (typeof subdata[k] == 'string')
						subdata[k] = render_string(subdata[k], repl, subdata);
				result.push(subdata.type ? new this.types[subdata.type] (path, subdata) : subdata);
			}
			rendered = result.length == 1 ? result[0] : result;

		} else {
			rendered = value;
		}

		this.cache[path] = rendered;
		return rendered;
	}
}
