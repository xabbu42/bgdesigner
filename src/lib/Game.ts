import {Collection,Bag,Dice,Stack} from "./collections.js"
import {Component,Token,Card} from "./components.js";
import colors from 'tailwindcss/colors.js'

export default class Game {

	types:object = {
		"Token": Token,
		"Card": Card,
		"Bag": Bag,
		"Dice": Dice,
		"Stack": Stack,
	}

	game:object = {}

	registry:object = {
		range: (g, d, a, b) => [...Array(b ? b - a + 1 : +a).keys()].map(i => i + (b ? +a : 1)),
		max: (g, d, p) => Math.max(...g.render(p, d)),
		min: (g, d, p) => Math.min(...g.render(p, d)),
		icon: (g, d, name, ...classes) => {
			let [color,shade] = (classes.find(v => v.match(/^(color|text)-/)) ?? '').replace(/^(color|text)-/, '').split('-');
			let src = new URL('https://api.iconify.design/');
			src.pathname = `/${name.replace(':', '/')}.svg`
			if (color)
				src.searchParams.set('color', colors[color][shade] ?? color ?? '');
			let style = classes.find(v => v.match(/^[wh]-/)) ? "" : "width: 1em; height: 1em; vertical-align: -0.125em; display: inline";
			return `<img src="${src}" style="${style}" class="${classes.join(' ')}" />`;
		}
	}

	constructor(data:object) {
		// this only handles . special in the first level of data
		// TODO do we want that everywhere? => implement it
		for (let path in data)
			this.setpath(path, data[path]);
	}

	allcomponents() {
		let result = [];
		let typeregex = new RegExp('\\.(' + Object.keys(this.types).concat(['type']).join('|') + ')$');
		for (let path of this.allpathes().filter(v => typeregex.test(v))) {
			let type = typeregex.exec(path)[1];
			let comppath = path.replace(/^@/, '').replace(typeregex, '');
			if (Component.isPrototypeOf(this.types[type == 'type' ? this.getpath(path) : type]) && this.getpath(comppath))
				result.push(this.render(comppath));
		}
		return result.flat(Infinity);
	}

	allpathes() {
		function* generator(obj: object, path: string[]) {
			for (let key in obj) {
				const newpath = path.concat(key);
				yield newpath.join('.');
				if (obj[key] !== null && typeof(obj[key])=="object")
					yield* generator(obj[key], newpath);
			}
		};

		return [...generator(this.game, [])];
	}

	getpath(path: string) {
		return path.split('.').reduce((v, p) => v[p], this.game);
	}

	setpath(path: string, value: any) {
		let cont = this.game;
		let parts = path.split('.');
		for (let part of parts.slice(0, -1)) {
			if (!(part in cont))
				cont[part] = part.match(/^\d+$/) ? [] : {};
			cont = cont[part];
		}
		cont[parts[parts.length-1]] = value;
	}

	repls(value: any, data: object) {
		const collections = {};
		if (typeof value !== 'object')
			value = {value};

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

		for (let str of allstrings(value)) {
			for (let expr of str.matchAll(/{{(%[^:]+?)}}/g)) {
				if (!collections[expr[1]] && !value[expr[1]]) {
					let values = this.render(expr[1], data);
					collections[expr[1]] = values instanceof Collection ? values : new Dice(expr[1], {Dice: values});
				}
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
		let pathes = this.allpathes().filter(v => v.startsWith('@') && path.startsWith(v.substring(1))).sort((a, b) => a.length - b.length);
		for (let annotation of pathes.map(p => this.getpath(p))) {
			if (typeof annotation == "object") {
				Object.assign(annotations, annotation);
			} else
				annotations.front = annotation; //hack for backwards compatibility with the great microgame
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
				throw new Error(`Unknown function ${func[2]}`);
			return this.registry[func[2]](this.game, data, ...func[3].split(/\s+/));
		}

		let regexp = new RegExp('(^|\\.)' + path.replace(/^%/, '').replaceAll('.', '\.').replaceAll('*', '.*') + '$');
		let pathes = this.allpathes().filter(v => regexp.test(v));
		if (pathes.filter(v => v == path).length > 0)
			pathes = [path];
		if (path.includes('*')) {
			let result = [];
			for (let p of pathes)
				result.push(this.render(p, data));
			return result;
		} else if (pathes.length == 0) {
			throw new Error(`Unknown path ${path}`);
		} else if (pathes.length > 1) {
			throw new Error(`Ambigious path ${path}: ${pathes.join(',')}`);
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
			rendered = Array.from(value.keys()).map(v => this.render(path + '.' + v, data)).flat(Infinity);

		} else if (typeof value == "object") {
			const annotations = this.annotations(path);
			for (let k in annotations)
				if (!(k in value))
					value[k] = annotations[k];

			const result = [];
			const repls = this.repls(value, data);
			for (let repl of repls) {
				const subdata = {...value, ...repl};
				for (let k in subdata)
					if (typeof subdata[k] == 'string')
						subdata[k] = render_string(subdata[k], repl, subdata);
				if (!subdata.type) {
					let typekeys = Object.keys(subdata).filter(v => this.types[v]);
					if (typekeys.length == 1)
						subdata.type = typekeys[0];
				}
				result.push(subdata.type ? new this.types[subdata.type] (path + (repls.length > 1 ? '.' + result.length : ''), subdata) : subdata);
			}
			rendered = result.length == 1 ? result[0] : result;

		} else {
			rendered = value;
		}

		this.cache[path] = rendered;
		return rendered;
	}
}
