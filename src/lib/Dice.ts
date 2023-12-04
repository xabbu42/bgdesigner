import type Collection from "./types.ts"

export default class Dice implements Collection {
	#values = []

	constructor(path: string, params: object) {
		this.path = path;
		this.#values = params.values;
		this.html = params.html;
	}

	values() {
		return [...this.#values];
	}

	draw(value = null) {
		let index = value == null ? Math.floor(Math.random() * this.values.length) : this.#values.findIndex((v) => v == value);
		let result = this.#values.slice(index, index + 1)[0];
		return result;
	}

	add(value) {
	}

	toString() {
		return this.html;
	}
}
