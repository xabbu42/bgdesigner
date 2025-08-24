
export interface Point {x: number; y: number}
export type Lock = 'None' | 'Hover' | 'Select';

export interface ComponentParams {
	pos?: Point;
	width?: number;
	height?: number;
	front?: string;
	back?: string;
	html?: string;
	class?: string;
	background?: string;
	flip?: boolean;
	shuffle?: boolean;
	[key: string]: any;
}

export interface GameData {
	[path: string]: any;
}

// Forward declaration to avoid circular dependency
export interface Component {
	game: string;
	path: string;
	pos?: Point;
	menu?: Point;
	dragoffset?: Point;
	width?: number;
	height?: number;
	usercolor?: string;
	lock: Lock;
	front?: string;
	back?: string;
	toString(): string;
}

export interface ComponentConstructor {
	new (game: string, path: string, params: ComponentParams): Component;
}

export interface TypeRegistry {
	[key: string]: ComponentConstructor;
}
