export abstract class Collection {
	protected _values:[any] = []
	constructor(path: string, params: object) {
		this.path = path;
		this._values = params.values;
		this.html = params.html;
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

	add(value) {
		this._values.push(value);
	}
}

export class Dice extends Collection {
	draw(value = null) {
		let index = value == null ? Math.floor(Math.random() * this._values.length) : this._values.findIndex((v) => v == value);
		let result = this._values.slice(index, index + 1)[0];
		return result;
	}

	add(value) {
	}
}
