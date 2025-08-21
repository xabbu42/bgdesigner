import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Game from '../src/lib/Game.svelte';
import { user } from '../src/lib/stores.js';
import { createTestGame, createPointerEvent } from './test-helpers.js';

describe('Camera Controls', () => {
	beforeEach(() => {
		user.set({ name: 'TestUser', color: '#ff0000' });
		vi.clearAllMocks();
	});

	describe('Zoom Functionality', () => {
		it('should zoom in on negative wheel delta', async () => {
			const game = createTestGame();
			const { container } = render(Game, { props: { game } });

			const viewport = container.querySelector('.viewport');
			const canvas = container.querySelector('.canvas');

			// Get initial scale
			const initialTransform = canvas?.getAttribute('style') || '';
			const initialScale = parseFloat(initialTransform.match(/scale\(([^)]+)\)/)?.[1] || '1');

			// Zoom in (negative delta)
			await fireEvent.wheel(viewport!, { deltaY: -100 });

			const newTransform = canvas?.getAttribute('style') || '';
			const newScale = parseFloat(newTransform.match(/scale\(([^)]+)\)/)?.[1] || '1');

			expect(newScale).toBeGreaterThan(initialScale);
		});

		it('should zoom out on positive wheel delta', async () => {
			const game = createTestGame();
			const { container } = render(Game, { props: { game } });

			const viewport = container.querySelector('.viewport');
			const canvas = container.querySelector('.canvas');

			// Get initial scale
			const initialTransform = canvas?.getAttribute('style') || '';
			const initialScale = parseFloat(initialTransform.match(/scale\(([^)]+)\)/)?.[1] || '1');

			// Zoom out (positive delta)
			await fireEvent.wheel(viewport!, { deltaY: 100 });

			const newTransform = canvas?.getAttribute('style') || '';
			const newScale = parseFloat(newTransform.match(/scale\(([^)]+)\)/)?.[1] || '1');

			expect(newScale).toBeLessThan(initialScale);
		});

		it('should zoom around mouse cursor position', async () => {
			const game = createTestGame();
			const { container } = render(Game, { props: { game } });

			const viewport = container.querySelector('.viewport');
			const canvas = container.querySelector('.canvas');

			// Zoom at specific point
			await fireEvent.wheel(viewport!, {
				deltaY: -100,
				clientX: 200,
				clientY: 200
			});

			const transform = canvas?.getAttribute('style') || '';

			// Should have both scale and translate changes
			expect(transform).toMatch(/scale\([^)]+\)/);
			expect(transform).toMatch(/translate\([^)]+\)/);
		});
	});

	describe('Pan Functionality', () => {
		it('should enter pan mode on viewport pointer down', async () => {
			const game = createTestGame();
			const { container } = render(Game, { props: { game } });

			const viewport = container.querySelector('.viewport');

			// Start pan
			await fireEvent.pointerDown(viewport!, createPointerEvent('pointerdown', {
				clientX: 100,
				clientY: 100
			}));

			// Should be in pan mode - verify by checking that subsequent moves affect camera
			const canvas = container.querySelector('.canvas');
			const initialTransform = canvas?.getAttribute('style') || '';

			await fireEvent.pointerMove(viewport!, createPointerEvent('pointermove', {
				clientX: 150,
				clientY: 150,
				movementX: 50,
				movementY: 50
			}));

			const newTransform = canvas?.getAttribute('style') || '';
			expect(newTransform).not.toBe(initialTransform);
		});

		it('should pan camera based on mouse movement', async () => {
			const game = createTestGame();
			const { container } = render(Game, { props: { game } });

			const viewport = container.querySelector('.viewport');
			const canvas = container.querySelector('.canvas');

			// Start pan mode
			await fireEvent.pointerDown(viewport!, createPointerEvent('pointerdown'));

			const initialTransform = canvas?.getAttribute('style') || '';
			const initialTranslate = initialTransform.match(/translate\(([^)]+)\)/)?.[1] || '0px,0px';

			// Pan with movement
			await fireEvent.pointerMove(viewport!, createPointerEvent('pointermove', {
				movementX: 50,
				movementY: 30
			}));

			const newTransform = canvas?.getAttribute('style') || '';
			const newTranslate = newTransform.match(/translate\(([^)]+)\)/)?.[1] || '0px,0px';

			expect(newTranslate).not.toBe(initialTranslate);
		});

		it('should exit pan mode on pointer up', async () => {
			const game = createTestGame();
			const { container } = render(Game, { props: { game } });

			const viewport = container.querySelector('.viewport');

			// Start pan
			await fireEvent.pointerDown(viewport!, createPointerEvent('pointerdown'));

			// End pan
			await fireEvent.pointerUp(viewport!, createPointerEvent('pointerup'));

			// Should exit pan mode - subsequent moves should not affect camera
			const canvas = container.querySelector('.canvas');
			const transformAfterPanEnd = canvas?.getAttribute('style') || '';

			await fireEvent.pointerMove(viewport!, createPointerEvent('pointermove', {
				movementX: 100,
				movementY: 100
			}));

			const transformAfterMove = canvas?.getAttribute('style') || '';
			expect(transformAfterMove).toBe(transformAfterPanEnd);
		});
	});

	describe('Coordinate Transformations', () => {
		it('should provide canvas coordinate conversion', () => {
			const game = createTestGame();
			const { component } = render(Game, { props: { game } });

			const canvasPoint = component.canvas({ x: 100, y: 100 });

			expect(canvasPoint.x).toBe(100);
			expect(canvasPoint.y).toBe(100);
		});

		it('should provide screen coordinate conversion', () => {
			const game = createTestGame();
			const { component } = render(Game, { props: { game } });

			const screenPoint = component.screen({ x: 100, y: 100 });

			expect(screenPoint.x).toBe(100);
			expect(screenPoint.y).toBe(100);
		});

		it('should handle coordinate transformations with different zoom levels', () => {
			const game = createTestGame();
			const { component } = render(Game, { props: { game } });

			const point = { x: 100, y: 100 };
			const camera1 = { x: 0, y: 0, z: 1 };
			const camera2 = { x: 0, y: 0, z: 2 };

			const canvas1 = component.canvas(point, camera1);
			const canvas2 = component.canvas(point, camera2);

			expect(canvas1.x).toBe(100);
			expect(canvas1.y).toBe(100);
			expect(canvas2.x).toBe(50);
			expect(canvas2.y).toBe(50);
		});

		it('should handle coordinate transformations when viewport is panned', () => {
			const game = createTestGame();
			const { component } = render(Game, { props: { game } });

			const point = { x: 100, y: 100 };
			const pannedCamera = { x: 50, y: 30, z: 1 };

			const canvasPoint = component.canvas(point, pannedCamera);
			const screenPoint = component.screen(point, pannedCamera);

			expect(canvasPoint.x).toBe(50);
			expect(canvasPoint.y).toBe(70);

			expect(screenPoint.x).toBe(150);
			expect(screenPoint.y).toBe(130);
		});

		it('should handle coordinate transformations with combined pan and zoom', () => {
			const game = createTestGame();
			const { component } = render(Game, { props: { game } });

			const point = { x: 200, y: 150 };
			const transformedCamera = { x: 25, y: 10, z: 2 };

			const canvasPoint = component.canvas(point, transformedCamera);
			const screenPoint = component.screen(point, transformedCamera);

			expect(canvasPoint.x).toBe(75);
			expect(canvasPoint.y).toBe(65);

			expect(screenPoint.x).toBe(450);
			expect(screenPoint.y).toBe(320);
		});
	});
});
