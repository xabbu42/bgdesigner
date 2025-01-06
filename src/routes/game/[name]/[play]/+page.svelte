<script lang="ts">
import { page } from '$app/stores';
import Game from "$lib/Game.js"
import GameComp from "$lib/MultiplayerGame.svelte"

export let data;
let game = new Game(data.gamedef, $page.params.play);
</script>

<svelte:head>
	<title>{$page.params.name} - {$page.params.play}</title>
</svelte:head>

<GameComp {game} />
