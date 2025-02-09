import { writable } from 'svelte/store';

export const user = writable({name: 'SinglePlayer', color: "hsl(240, 70%, 70%)"});
