
export function textfit(el, options = {}) {
	const computed = window.getComputedStyle(el);
	const targetheight = parseInt(computed.height);
	const targetwidth = parseInt(computed.width);
	let size = parseInt(computed.fontSize);
	let low = options.up ? size : 4;
	let high = options.down ? size : 80;
	let mid;
	el.style.overflow = "hidden";
    while (low <= high) {
		mid = (high + low) >> 1;
		el.style.height = targetheight;
		el.style.fontSize = mid + 'px';
		console.log(mid + 'px', el.scrollHeight);
		if(el.scrollWidth <= targetwidth + 1 && el.scrollHeight <= targetheight) {
			size = mid;
			low = mid + 1;
		} else {
			high = mid - 1;
		}
    }
	console.log("Final:", el, size + 'px');
	el.style.fontSize = size + 'px';
}
