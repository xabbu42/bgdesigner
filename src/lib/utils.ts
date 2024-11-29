
export function serialize(val:any, filter = v => false):string {
	if (Array.isArray(val)) {
		let subs = val.map(v => serialize(v, filter));
		let result = '[ ' + subs.join(', ') + ' ]';
		if (result.length > 160)
			result = "[\n    " + subs.join(",\n").replaceAll("\n", "\n    ") + "\n]" ;
		return result;
	} else if (val !== null && typeof(val)== "object") {
		let subs = Object.entries(val).map(v => filter(v[0]) ? false : (v[0].toString() + ':' + serialize(v[1], filter))).filter(Boolean);
		let result = '{ ' + subs.join(', ') + ' }';
		if (result.length > 160)
			result = "{\n    " + subs.join(",\n").replaceAll("\n", "\n    ") + "\n}";
		return result;
	} else {
		return val === undefined ? 'undefined' : (val === null ? 'null' : val.toString());
	}
};

export function hash(str:string) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
	}
	return hash;
}

export function hashcolor(str:string) {
	return `hsl(${(hash(str) % 360)}, 70%, 70%)`;
}

export function textfit(el:HTMLElement, options:{up?:boolean,down?:boolean} = {}) {
	const computed = window.getComputedStyle(el);
	const targetheight = parseInt(computed.height);
	const targetwidth = parseInt(computed.width);
	let size = parseInt(computed.fontSize);
	let low = options.up ? size : 4;
	let high = options.down ? size : 80;
	let mid;
    while (low <= high) {
		mid = (high + low) >> 1;
		el.style.height = targetheight.toString();
		el.style.fontSize = mid + 'px';
		if(el.scrollWidth <= targetwidth + 1 && el.scrollHeight <= targetheight + 1) {
			size = mid;
			low = mid + 1;
		} else {
			high = mid - 1;
		}
    }
	el.style.fontSize = size + 'px';
}
