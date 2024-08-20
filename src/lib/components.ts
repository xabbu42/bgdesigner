import type {Point} from "./types.js";

function render_string(value:string, params:any) {
	return value.replaceAll(/{{(.+?)}}/g, (_,expr) => params[expr] ?? '');
}

export abstract class Component {
	path: string;

	//TODO this is for interactive Game.svelte and does not really belong here
	pos?: Point;
	menu?: Point;
	width?: number;
	height?: number;
	draging: boolean = false;

	constructor(path: string, params:any) {
		this.path = path;
		if (params.pos)
			this.pos = params.pos;
	}
}

export class Token extends Component {
	flipped: boolean;
	front: string;
	back: string;

	constructor(path: string, params:any) {
		super(path, params);
		this.flipped = false;
		this.front = render_string(params.front || "<div class=\"{{class}} front token\">{{Token}}</div>", params);
		this.back = render_string(params.back || "<div class=\"{{class}} back token\">{{Token}}</div>", params);
	}

	toString() {
		return this.flipped ? this.back : this.front;
	}

	flip() {
		this.flipped = !this.flipped;
	}
}

export class Card extends Token {
	constructor(path: string, params:any) {
		if (!params.front)
			params.front = "<div class=\"{{class}} card front relative\"><div class=\"absolute top-4 left-4 bottom-4 right-4\">{{background}}</div><div class=\"absolute top-4 left-4\">{{Card}}</div><div class=\"center\">{{Card}}</div><div class=\"absolute bottom-4 right-4 rotate-180\">{{Card}}</div></div>";
		if (!params.back)
			params.back = "<div class=\"{{class}} card back relative\"></div>";
		super(path, params);
	}
}
