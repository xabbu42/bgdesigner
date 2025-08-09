import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
	value: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
	},
	writable: true,
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
	width: 100,
	height: 100,
	top: 0,
	left: 0,
	bottom: 100,
	right: 100,
	x: 0,
	y: 0,
	toJSON: vi.fn(),
}));
