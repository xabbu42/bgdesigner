
export function* allpathes(obj, path = []) {
    for (let key in obj) {
        const newpath = path.concat(key);
        yield newpath.join('.');
        if (obj[key] !== null && typeof(obj[key])=="object")
            yield* allpathes(obj[key], newpath);
    }
}

function* allstrings(obj) {
    for (let key in obj) {
		switch (typeof(obj[key])) {
			case "object":
				//yield* allstrings(obj[key]);
				break;
			case "string":
				yield obj[key];
				break;
		}
    }
}

function getpath(obj, path) {
	let value = obj;
	let prefix = '';
	for (let part of path.split('.')) {
		if (value[prefix + part]) {
			value = value[prefix + part];
			prefix = '';
		} else
			prefix += part + '.';
	}
	return prefix ? value[prefix] : value;
}

function repls(value, data, game) {
	const collections = {};
	if (typeof value !== 'object')
		value = {value};
	for (let str of allstrings(value)) {
		for (let expr of str.matchAll(/{{([^:]+?)}}/g)) {
			if (!collections[expr[1]]) {
				let v = render(expr[1], data, game);
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

export function render(path, data, game) {

	let icon = path.match(/^([\w-]+:[\w-]+)\s*(.*)$/);
	if (icon)
		return `<iconify-icon icon="${icon[1]}" style="${icon[2]}"></iconify-icon>`;

	let value = getpath(data, path);
	if (value === undefined) {
		let fullpath = [...allpathes(game)].filter((v) => v.endsWith(path));
		if (fullpath.length == 1) {
			path = fullpath[0];
			value = getpath(game, path);
		}
	}

	switch (typeof value) {
		case "string":
			const result = repls(value, data, game).map((repl) => value.replaceAll(/{{(.+?)}}/g, (_,expr) => repl[expr] || render(expr, data, game)));
			return result.length == 1 ? result[0] : result;
			break;

		case "object":
			if (Array.isArray(value)) {
				return Array.from(value.keys()).map((v) => render(path + '.' + v, data, game));
			} else {
				let templkeys = [...allpathes(game)].filter((v) => v.startsWith('.') && path.startsWith(v.substring(1))).sort((a, b) => a.length - b.length);
				if (templkeys.length > 0) {
					const result = [];
					const subdata = Object.create(data);
					for (let repl of repls(value, data, game)) {
						Object.assign(subdata, repl);
						for (let k in value)
							subdata[k] = render(path + '.' + k, subdata, game);
						result.push(render(templkeys[0], subdata, game));
					}
					return result;
				} else {
					return  Object.fromEntries(Object.keys(value).map((v) => [v, render(path + '.' + v, data, game)]));
				}
			}
			break;

		default:
			return value;
			break;
	}
}
