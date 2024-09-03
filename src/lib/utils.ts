export function hash(str:string) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
	}
	return hash;
}

export function hashcolor(str:string) {
	return `hsl(${(hash(str) % 360)}, 70%, 50%)`;
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
