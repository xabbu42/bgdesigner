import Game from '../src/lib/Game.js';

export function createTestGame(): Game {
	const game = new Game({
		'token1': {'Token': '', 'pos': {'x': 100, 'y': 100}, 'width': 100, 'height': 100},
		'card1': {'Card': '', 'pos': {'x': 200, 'y': 100}, 'width': 100, 'height': 100},
		'stack1': {'Stack': [{'Card': ''}, {'Card': ''}], 'pos': {'x': 300, 'y': 100}, 'width': 100, 'height': 100}
	}, 'test-game');

	return game;
}

export function createPointerEvent(type: string, options: Partial<PointerEvent> = {}): PointerEvent {
	// Create a mock PointerEvent for test environment
	const event = new Event(type, {
		bubbles: true,
		cancelable: true,
		...options
	}) as any;

	// Add PointerEvent-specific properties
	event.button = options.button ?? 0;
	event.clientX = options.clientX ?? 150;
	event.clientY = options.clientY ?? 150;
	event.x = event.clientX;
	event.y = event.clientY;
	event.pointerId = options.pointerId ?? 1;
	event.pointerType = options.pointerType ?? 'mouse';
	event.isPrimary = options.isPrimary ?? true;

	return event as PointerEvent;
}
