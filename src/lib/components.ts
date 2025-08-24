import {type Point, type Lock, type ComponentParams} from "./types.js";

function render_string(value: string, params: ComponentParams): string {
	return value.replaceAll(/{{(.+?)}}/g, (_, expr) => params[expr] ?? '');
}

export abstract class Component {
	game: string;
	path: string;

	//TODO this is for interactive Game.svelte and does not really belong here
	pos?: Point;
	menu?: Point;
	dragoffset?: Point;
	width?: number;
	height?: number;
	usercolor?: string;
	lock: Lock = 'None';

	constructor(game: string, path: string, params: ComponentParams) {
		this.game = game;
		this.path = path;
		if (params.pos)
			this.pos = params.pos;
		if (params.height)
			this.height = params.height;
		if (params.width)
			this.width = params.width;
	}

	abstract toString(): string;
}

export class Token extends Component {
	flipped: boolean;
	front: string;
	back: string;

	constructor(game: string, path: string, params: ComponentParams) {
		super(game, path, params);
		this.flipped = false;
		this.front = render_string(params.front || "<div class=\"{{class}} front token\">{{Token}}</div>", params);
		this.back = render_string(params.back || "<div class=\"{{class}} back token\">{{Token}}</div>", params);
	}

	toString(): string {
		return this.flipped ? this.back : this.front;
	}

	flip(): void {
		this.flipped = !this.flipped;
	}
}

export class Card extends Token {
	constructor(game: string, path: string, params: ComponentParams) {
		if (!params.front)
			params.front = "<div class=\"{{class}} card front relative\"><div class=\"absolute top-4 left-4 bottom-4 right-4\">{{background}}</div><div class=\"absolute top-4 left-4\">{{Card}}</div><div class=\"center\">{{Card}}</div><div class=\"absolute bottom-4 right-4 rotate-180\">{{Card}}</div></div>";
		if (!params.back)
			params.back = "<div class=\"{{class}} card back relative\"></div>";
		super(game, path, params);
	}
}
