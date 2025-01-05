<script lang="ts">
import { page } from '$app/stores';
import { members } from '$lib/globals';
import randomWords from 'random-words';

let plays = $members.filter(
	v => v.data && v.data.params && v.data.params.name == $page.params.name && v.data.params.play).reduce(
		(acc, v) => { (acc[v.data.params.play] = acc[v.data.params.play] || []).push(v); return acc },
		{}
	);

</script>

<svelte:head>
	<title>{$page.params.name} - Lobby</title>
</svelte:head>

<div>
	<ul class="max-w-md divide-y m-2 border-solid border-2">
		{#each Object.entries(plays) as [play, members]}
			<li class="p-1">
				<a href="/game/{$page.params.name}/{play}">
					{play}
					{#each members as member(member.connectionId)}
						<span class="m-1 p-1 rounded-xl" style="background-color: {member.data.color}">{member.data.name}</span>
					{/each}
				</a>
			</li>
		{/each}
	</ul>
	<a class="m-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" href="/game/{$page.params.name}/{randomWords()}">
		New
	</a>
</div>
