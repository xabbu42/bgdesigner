<script lang="ts">
import { page } from '$app/stores';
import { getContext } from 'svelte';
import { writable } from 'svelte/store';
import Game from "$lib/Game.js"
import GameComp from "$lib/Game.svelte"

export let data;
let games = getContext('games');
if (!$games[$page.params.name])
	$games[$page.params.name] = {};
if (!$games[$page.params.name][$page.params.play])
	$games[$page.params.name][$page.params.play] = writable(new Game($page.params.play, data.gamedef));
let game = $games[$page.params.name][$page.params.play];
</script>

<GameComp {game} />
