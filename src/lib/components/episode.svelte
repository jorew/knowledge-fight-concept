<script lang="ts">
	import { type Cast, type Meta } from '$lib/stores/casts';
	export let cast: Cast;
	export let meta: Meta;

	import { audioManager } from '$lib/player/audio';
	import type { Track } from '$lib/player/player';

	let newTrack: Track = {
		title: cast.title,
		artist: meta.owner.name,
		path: cast.streamUrl,
		cover: cast.itunesImage === '' ? meta.image : cast.itunesImage,
		id: cast.guid
	};

	let currentTrack = audioManager?.currentTrack;
	let isPlaying = audioManager?.isPlaying;

	let isThisTrackPlaying = $isPlaying && $currentTrack?.id === cast.guid;

	function addTrack() {
		// if this track is the one being played, pause it
		if ($currentTrack?.id === cast.guid) {
			if ($isPlaying) audioManager?.pause();
			else audioManager?.play();
		} else if (audioManager) {
			console.log('Adding track to queue:', newTrack);
			audioManager.enqueue(newTrack);
			audioManager.play();
		}
	}
</script>

<div
	class="flex justify-start gap-4 rounded-xl border border-neutral-500/40 bg-slate-500/10 px-2 py-1 text-neutral-700 transition-colors duration-200 hover:bg-slate-500/30 hover:text-neutral-900 md:flex dark:text-neutral-300 dark:hover:text-neutral-100"
>
	<button class="group ratio-square relative mt-1 h-20 w-20 min-w-20" on:click={addTrack}>
		<img
			src={cast.itunesImage === '' ? meta.image : cast.itunesImage}
			alt={cast.title}
			class="h-20 w-20 cursor-pointer rounded-md border-2 border-black object-cover"
		/>
		<div
			class="absolute inset-0 bottom-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		>
			<div
				class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/80 p-2 text-white"
			>
				<iconify-icon
					icon="lucide:play"
					height="1.75em"
					width="full"
					class={isThisTrackPlaying ? 'hidden' : ''}
				></iconify-icon>
				<iconify-icon
					icon="lucide:pause"
					height="1.75em"
					width="full"
					class={isThisTrackPlaying ? '' : 'hidden'}
				></iconify-icon>
			</div>
		</div>
	</button>
	<div class="flex flex-col justify-start text-left align-top">
		<h3 class="text-lg font-semibold text-slate-800 dark:text-slate-300">
			{cast.title} <span class="font-base text-base text-slate-500">({cast.duration})</span>
		</h3>

		<p class="line-clamp-3">{@html cast.description}</p>
	</div>
</div>
