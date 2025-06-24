import type {Point, ComponentParams} from "./types.js";
import {Component} from "./components.js";
import seedrandom from "seedrandom";

export abstract class Collection extends Component {
	html: string;
	protected _values: Component[] = []
	rng: () => number;

	constructor(game: string, path: string, params: ComponentParams) {
		super(game, path, params);
		this.rng = seedrandom(game + '|' + path);

		let type = this.constructor.name;
		this._values = Array.isArray(params[type]) ? params[type] : [params[type]];
		this.html = params.html ?? '';
	}

	values(): Component[] {
		return [...this._values];
	}

	length(): number {
		return this._values.length;
	}

	toString(): string {
		return this.html;
	}

	abstract draw(value?: Component | null): Component;
	abstract add(...args: Component[]): void;
}

export class Bag extends Collection {
	draw(value: Component | null = null): Component {
		let index = value == null ? Math.floor(this.rng() * this._values.length) : this._values.findIndex((v) => v == value);
		let result = this._values.splice(index, 1)[0];
		return result;
	}

	add(...args: Component[]): void {
		this._values.push(...args);
	}
}

export class Stack extends Collection {

	constructor(game: string, path: string, params: ComponentParams) {
		super(game, path, params);
		if (params.flip)
			this.flip();
		if (params.shuffle)
			this.shuffle();
	}

	draw(value: Component | null = null): Component {
		let index = value == null ? this._values.length - 1 : this._values.findIndex((v) => v == value);
		let result = this._values.splice(index, 1)[0];
		return result;
	}

	add(...args: Component[]): void {
		this._values.push(...args);
	}

	flip(): void {
		this._values.forEach(v => {
			if ('flip' in v && typeof v.flip === 'function') {
				(v as any).flip();
			}
		});
		this._values.reverse();
	}

	shuffle(): void {
		for (let i = this._values.length - 1; i > 0; i--) {
			const j = Math.floor(this.rng() * (i + 1));
			[this._values[i], this._values[j]] = [this._values[j], this._values[i]]
		}
	}

	toString(): string {
		return `<div class="grid">`
			+ this._values.map((v, i) => `<div class="col-start-1 row-start-1" style="margin-left:${i*2}px; margin-top:${i*2}px;">${v}</div>`).join('')
			+ '</div>';
	}
}

export class Dice extends Collection {
	draw(value: Component | null = null): Component {
		let index = value == null ? Math.floor(this.rng() * this._values.length) : this._values.findIndex((v) => v == value);
		let result = this._values.slice(index, index + 1)[0];
		return result;
	}

	add(): void {
		// Dice don't add new values
	}
}
