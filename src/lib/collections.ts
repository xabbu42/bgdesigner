import type {Point} from "types.js";

export abstract class Collection {
	protected _values:[any] = []
	pos: Point = {x:0, y:0};

	constructor(path: string, params: object) {
		this.path = path;
		let type = this.constructor.name;
		this._values = Array.isArray(params[type]) ? params[type] : [params[type]];
		this.html = params.html;
		if (params.pos)
			this.pos = params.pos;
		if (params.flip)
			this.flip();
		if (params.shuffle)
			this.shuffle();
	}

	values():[any] {
		return [...this._values];
	}


	toString() {
		return this.html;
	}

	abstract draw():any
	abstract add(v:any)
}

export class Bag extends Collection {
	draw(value = null) {
		let index = value == null ? Math.floor(Math.random() * this._values.length) : this._values.findIndex((v) => v == value);
		let result = this._values.splice(index, 1)[0];
		return result;
	}

	add(...args) {
		this._values.push(...args);
	}
}

export class Stack extends Collection {
	draw(value = null) {
		let index = value == null ? this._values.length - 1 : this._values.findIndex((v) => v == value);
		let result = this._values.splice(index, 1)[0];
		return result;
	}

	add(...args) {
		this._values.push(...args);
	}

	flip() {
		this._values.map(v => v.flip());
		this._values.reverse();
	}

	shuffle() {
		for (let i = this._values.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this._values[i], this._values[j]] = [this._values[j], this._values[i]]
		}
	}

	toString() {
		return `<div class="relative">`
			+ this._values.map((v, i) => i > 0 ? `<div class="absolute" style="left:${i*2}px; top:${i*2}px;">${v}</div>` : `<div>${v}</div>`).join('')
			+ '</div>';
	}
}

export class Dice extends Collection {
	draw(value = null) {
		let index = value == null ? Math.floor(Math.random() * this._values.length) : this._values.findIndex((v) => v == value);
		let result = this._values.slice(index, index + 1)[0];
		return result;
	}

	add() {
	}
}
