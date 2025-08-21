import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Game from '../src/lib/Game.svelte';
import { user } from '../src/lib/stores.js';
import { Lock } from '../src/lib/types.js';
import { createTestGame, createPointerEvent } from './test-helpers.js';

describe('Game.svelte', () => {
	beforeEach(() => {
		user.set({ name: 'TestUser', color: '#ff0000' });
		vi.clearAllMocks();
	});

	describe('Selection', () => {
		it('should select component on pointer down', async () => {
			const mockGame = createTestGame();
			const { container, component } = render(Game, { props: { game: mockGame } });

			const lockHandler = vi.fn();
			component.$on('lock', lockHandler);

			const token = container.querySelector('.token');
			await fireEvent(token!, createPointerEvent('pointerdown'));

			expect(lockHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: expect.objectContaining({
						lock: Lock.Select,
						path: 'token1'
					})
				})
			);
		});

		it('should not select component if lock event is cancelled', async () => {
			const mockGame = createTestGame();
			const { container, component } = render(Game, { props: { game: mockGame } });

			const lockHandler = vi.fn((event) => {
				event.preventDefault(); // Cancel the lock event
			});
			component.$on('lock', lockHandler);

			const token = container.querySelector('.token');

			await fireEvent(token!, createPointerEvent('pointerdown'));

			expect(lockHandler).toHaveBeenCalled();
			// Component should not be selected since event was cancelled
			expect(mockGame.render('token1').lock).toBe(Lock.None);
		});

		it('should select on contextmenu', async () => {
			const mockGame = createTestGame();
			const { container, component } = render(Game, { props: { game: mockGame } });

			const lockHandler = vi.fn();
			component.$on('lock', lockHandler);

			const token = container.querySelector('.token');
			await fireEvent(token!, createPointerEvent('contextmenu'));

			expect(lockHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: expect.objectContaining({
						lock: Lock.Select,
						path: 'token1'
					})
				})
			);
		});
	});

	describe('Drag and Drop', () => {
		it('should start drag mode on pointer down', async () => {
			const mockGame = createTestGame();
			const { container, component } = render(Game, { props: { game: mockGame } });

			const lockHandler = vi.fn();
			component.$on('lock', lockHandler);

			const token = container.querySelector('.token');
			await fireEvent(token, createPointerEvent('pointerdown'));

			expect(lockHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: expect.objectContaining({
						lock: Lock.Select,
						dragoffset: expect.objectContaining({
							x: expect.any(Number),
							y: expect.any(Number)
						})
					})
				})
			);
		});

		it('should update component position during drag', async () => {
			const mockGame = createTestGame();
			const { container, component } = render(Game, { props: { game: mockGame } });

			const token = container.querySelector('.token');

			// Start drag
			await fireEvent(token!, createPointerEvent('pointerdown', { clientX: 100, clientY: 100 }));

			// Move mouse
			const viewport = container.querySelector('.viewport');
			await fireEvent.pointerMove(viewport!, createPointerEvent('pointermove', { clientX: 200, clientY: 200 }));

			// Position should be updated (accounting for drag offset)
			expect(mockGame.render('token1').pos).toBeDefined(); // TODO test correct position
		});

		it('should go back to hover on pointer up', async () => {
			const mockGame = createTestGame();
			const { container, component } = render(Game, { props: { game: mockGame } });

			const lockHandler = vi.fn();
			component.$on('lock', lockHandler);

			const token = container.querySelector('.token');
			const viewport = container.querySelector('.viewport');

			// Start drag
			await fireEvent(token, createPointerEvent('pointerdown'));

			// End drag
			await fireEvent.pointerUp(viewport);

			expect(lockHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: expect.objectContaining({
						lock: Lock.Hover
					})
				})
			);
		});
	});

	describe('Context Menu', () => {
		it('should execute flip action when flip button clicked', async () => {
			const mockGame = createTestGame();

			const { container, component } = render(Game, { props: { game: mockGame } });

			const gameEventHandler = vi.fn();
			component.$on('gameevent', gameEventHandler);

			// Trigger context menu to show flip button
			const token = container.querySelector('.token');
			await fireEvent.contextMenu(token);

			// Find and click flip button
			const flipButton = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('flip'));
			expect(flipButton).toBeTruthy();
			await fireEvent.click(flipButton);

			expect(gameEventHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: expect.objectContaining({
						action: 'flip'
					})
				})
			);
		});

		it('should execute draw action', async () => {
			const mockGame = createTestGame();

			const { container, component } = render(Game, { props: { game: mockGame } });

			const gameEventHandler = vi.fn();
			component.$on('gameevent', gameEventHandler);

			// Trigger context menu to show draw button
			const stack = container.querySelector('.grid'); //TODO should not depend on a tailwind class here
			await fireEvent.contextMenu(stack);

			// Find and click draw button
			const drawButton = Array.from(container.querySelectorAll('button')).find(btn => btn.textContent?.includes('draw'));
			expect(drawButton).toBeTruthy();
			await fireEvent.click(drawButton);

			expect(gameEventHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					detail: expect.objectContaining({
						action: 'draw'
					})
				})
			);
		});
	});
});
