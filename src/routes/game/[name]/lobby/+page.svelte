<script lang="ts">
import { getContext } from 'svelte';
import { page } from '$app/stores';
import randomWords from 'random-words'

let games = getContext('games');
if (!$games[$page.params.name])
	$games[$page.params.name] = {};

</script>

<div>
	<ul class="max-w-md divide-y m-2 border-solid border-2">
		{#each Object.keys($games[$page.params.name]) as game}
			<li class="p-1">
				<a href="/game/{$page.params.name}/{game}">{game}</a>
			</li>
		{/each}
	</ul>
	<a class="m-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" href="/game/{$page.params.name}/{randomWords()}">
		New
	</a>
</div>
