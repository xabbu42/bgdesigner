import type {Point} from "types.js";

export default class Token {
	path: string;
	flipped: boolean;
	front: string;
	back: string;
	pos: Point = {x: 0, y: 0};
	width: number;
	height: number;

	constructor(path: string, params: object) {
		this.path = path;
		this.flipped = false;
		this.front = params.front || params.html;
		this.back = params.back || params.html;
		if (params.pos)
			pos = params.pos;
	}

	toString() {
		return this.flipped ? this.back : this.front;
	}

	flip() {
		this.flipped = !this.flipped;
	}
}
