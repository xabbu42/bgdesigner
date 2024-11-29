import type {Point} from "./types.js";
import {Component} from "./components.js";

export abstract class Collection extends Component {
	html: string;
	protected _values:any[] = []

	constructor(game: string, path: string, params: any) {
		super(game, path, params);

		let type = this.constructor.name;
		this._values = Array.isArray(params[type]) ? params[type] : [params[type]];
		this.html = params.html ?? '';
	}

	values():any[] {
		return [...this._values];
	}

	length() {
		return this._values.length;
	}


	toString() {
		return this.html;
	}

	abstract draw():any
	abstract add(...args:any[]):void
}

export class Bag extends Collection {
	draw(value:any = null) {
		let index = value == null ? Math.floor(Math.random() * this._values.length) : this._values.findIndex((v) => v == value);
		let result = this._values.splice(index, 1)[0];
		return result;
	}

	add(...args:any[]):void {
		this._values.push(...args);
	}
}

export class Stack extends Collection {

	constructor(game:string, path: string, params: any) {
		super(game, path, params);
		if (params.flip)
			this.flip();
		if (params.shuffle)
			this.shuffle();
	}

	draw(value:any = null) {
		let index = value == null ? this._values.length - 1 : this._values.findIndex((v) => v == value);
		let result = this._values.splice(index, 1)[0];
		return result;
	}

	add(...args:any[]):void {
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
		return `<div class="grid">`
			+ this._values.map((v, i) => `<div class="col-start-1 row-start-1" style="margin-left:${i*2}px; margin-top:${i*2}px;">${v}</div>`).join('')
			+ '</div>';
	}
}

export class Dice extends Collection {
	draw(value:any = null) {
		let index = value == null ? Math.floor(Math.random() * this._values.length) : this._values.findIndex((v) => v == value);
		let result = this._values.slice(index, index + 1)[0];
		return result;
	}

	add() {
	}
}
