export default class Token {
	constructor(path: string, params: object) {
		this.path = path;
		this.flipped = false;
		this.front = params.front || params.html;
		this.back = params.back || params.html;
	}

	toString() {
		return this.flipped ? this.back : this.front;
	}

	flip() {
		this.flipped = !this.flipped;
	}
}
