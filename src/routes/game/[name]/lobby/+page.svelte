<script lang="ts">
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import Game from "$lib/Game.js"
import Lobby from "$lib/Lobby.svelte"

export let data;

</script>

<svelte:head>
	<title>{$page.params.name} - Lobby</title>
</svelte:head>

<Lobby gamedef={data.gamedef} ably_namespace={$page.params.name} new_play="{(p) => {goto('/game/' + $page.params.name + '/' + p)}}" />

