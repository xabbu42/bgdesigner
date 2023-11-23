export default class Token {
	constructor(params: object) {
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
