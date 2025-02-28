<script lang="ts">
	import { audioManager } from '$lib/player/audio';
	import type { Track } from '$lib/player/player';
	import { writable, derived } from 'svelte/store';
	import Slider, { formatTimeToHHMMSS } from './ui/slider.svelte';
	import { onMount, onDestroy } from 'svelte';

	const value = writable([0]);
	const tempValue = writable([0]);
	const isFullscreen = writable(false);

	$: isReady = !!audioManager;
	$: isPlaying = audioManager && audioManager.isPlaying;
	let currentTrack = audioManager && audioManager.currentTrack;
	let duration = audioManager && audioManager.audio.duration;
	let currentTime = audioManager && audioManager.audio.currentTime;

	let isSeeking = false;

	// Initialize Media Session API
	function setupMediaSession() {
		if ('mediaSession' in navigator && $currentTrack) {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: $currentTrack.title || 'Unknown Title',
				artist: $currentTrack.artist || 'Unknown Artist',
				album: $currentTrack.album || 'Unknown Album',
				artwork: [
					{
						src: $currentTrack.cover || 'https://i.imgur.com/3H81atT.jpeg',
						sizes: '512x512',
						type: 'image/jpeg'
					}
				]
			});

			// Set up action handlers
			navigator.mediaSession.setActionHandler('play', () => {
				audioManager && !$isPlaying && audioManager.playPause();
			});

			navigator.mediaSession.setActionHandler('pause', () => {
				audioManager && $isPlaying && audioManager.playPause();
			});

			navigator.mediaSession.setActionHandler('previoustrack', () => {
				audioManager && audioManager.prev();
			});

			navigator.mediaSession.setActionHandler('nexttrack', () => {
				audioManager && audioManager.next();
			});

			navigator.mediaSession.setActionHandler('seekbackward', (details) => {
				const skipTime = details.seekOffset || 10;
				$currentTime && audioManager?.audio.setCurrentTime($currentTime - skipTime);
			});

			navigator.mediaSession.setActionHandler('seekforward', (details) => {
				const skipTime = details.seekOffset || 10;
				$currentTime && audioManager?.audio.setCurrentTime($currentTime + skipTime);
			});

			// Add seek to position
			navigator.mediaSession.setActionHandler('seekto', (details) => {
				if (details.seekTime && $duration) {
					audioManager?.audio.setCurrentTime(details.seekTime);
				}
			});
		}
	}

	// Update position state periodically
	function updatePositionState() {
		if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession && $duration) {
			navigator.mediaSession.setPositionState({
				duration: $duration,
				playbackRate: 1.0,
				position: $currentTime || 0
			});
		}
	}

	// Update media session when track changes
	$: if ($currentTrack && isReady) {
		console.log('Setting up media session');
		setupMediaSession();
	}

	// Update position state when current time changes
	$: if ($currentTime && isReady) {
		updatePositionState();
	}

	// Update playback state
	$: if (isReady) {
		if ('mediaSession' in navigator) {
			navigator.mediaSession.playbackState = $isPlaying ? 'playing' : 'paused';
		}
	}

	audioManager &&
		audioManager.audio.currentTime.subscribe((time) => {
			if (!isSeeking) {
				// <--- Conditional update based on isSeeking
				value.set([time]);
			}
		});

	// Track changes subscription
	onMount(() => {
		if (audioManager) {
			const unsubscribe = audioManager.currentTrack.subscribe((track) => {
				if (track) {
					setupMediaSession();
				}
			});

			return unsubscribe;
		}
	});

	function handlePlayPause() {
		audioManager && audioManager.playPause();
	}

	function handleNext() {
		audioManager && audioManager.next();
	}

	function handlePrev() {
		audioManager && audioManager.prev();
	}

	function handleSeekBack() {
		$currentTime && audioManager?.audio.setCurrentTime($currentTime - 15);
	}

	function handleSeekForward() {
		$currentTime && audioManager?.audio.setCurrentTime($currentTime + 15);
	}

	function handleSeeked(percentage: number) {
		$currentTime && $duration && audioManager?.audio.setCurrentTime(($duration * percentage) / 100);

		// Update media session position
		updatePositionState();
	}

	function toggleFullscreen() {
		$isFullscreen = !$isFullscreen;
	}
</script>

{#if isReady && $currentTrack}
	<!-- Container for both mini player and fullscreen player -->
	<div class="relative">
		<!-- Mini Player (shown when not fullscreen) -->
		{#if !$isFullscreen}
			<div class="fixed right-0 bottom-0 left-0 flex justify-center">
				<div
					class="flex w-screen max-w-4xl flex-row justify-start rounded-xl border-3 border-neutral-500/50 bg-neutral-200/75 p-2 align-middle drop-shadow-[0_25px_25px_#0004] backdrop-blur-md md:border-2 dark:bg-neutral-800/75"
				>
					<div class="flex w-full flex-col space-x-4 md:flex-row">
						<button
							on:click={handlePlayPause}
							class="hidden aspect-square h-full w-min items-center justify-center rounded-full border border-neutral-500/40 text-neutral-700 transition-colors duration-200 hover:bg-slate-500/50 hover:text-neutral-900 md:flex dark:text-neutral-300 dark:hover:text-neutral-100"
						>
							{#if $isPlaying}
								<iconify-icon height="2em" icon="lucide:pause"></iconify-icon>
							{:else}
								<iconify-icon icon="lucide:play" height="2em"></iconify-icon>
							{/if}
						</button>
						<div class="flex h-full w-full flex-col items-center justify-center md:pr-4">
							<div class="-mt-1 flex h-0 w-full justify-between text-sm text-neutral-500 md:hidden">
								<div>{formatTimeToHHMMSS($currentTime || 0)}</div>
								<div>{formatTimeToHHMMSS($duration || 0)}</div>
							</div>
							<div
								class="-mb-8 flex w-full items-start justify-between pb-3 text-center md:mb-0 md:pb-0 md:text-left"
							>
								<div class="flex-1">
									{$currentTrack?.title || ''}
								</div>
								<button
									aria-label="Toggle fullscreen"
									on:click={toggleFullscreen}
									class="absolute right-2 bottom-2 mt-0.5 -mb-2 text-base text-neutral-700 hover:text-neutral-900 md:static dark:text-neutral-300 dark:hover:text-neutral-100"
								>
									<iconify-icon icon="lucide:maximize-2" height="1em"></iconify-icon>
								</button>
							</div>
							<Slider
								class="-mt-[1.88rem] mb-8 px-1 md:-mt-3 md:mb-1"
								max={duration}
								progress={$currentTime && $duration ? ($currentTime / $duration) * 100 : 0}
								length={$duration}
								onSeeked={handleSeeked}
							/>
							<div class="flex w-full items-center justify-between space-x-2">
								<div
									class="flex w-full items-center justify-center space-x-3 text-2xl md:justify-start"
								>
									<button
										on:click={handleSeekBack}
										class="relative mt-0.5 -mb-2 text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
										><iconify-icon icon="lucide:rotate-ccw"></iconify-icon>
										<div class="absolute top-1 right-0 left-0 text-xs">15</div>
									</button>
									<button
										on:click={handlePlayPause}
										class="flex aspect-square h-full w-min items-center justify-center rounded-full bg-slate-500/40 px-2 text-neutral-700 transition-colors duration-200 hover:bg-slate-500/50 hover:text-neutral-900 md:hidden dark:text-neutral-300 dark:hover:text-neutral-100"
									>
										{#if $isPlaying}
											<iconify-icon height="1.25em" icon="lucide:pause"></iconify-icon>
										{:else}
											<iconify-icon icon="lucide:play" height="1.25em"></iconify-icon>
										{/if}
									</button>
									<button
										on:click={handleSeekForward}
										class="relative mt-0.5 -mb-2 text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
										><iconify-icon icon="lucide:rotate-cw"></iconify-icon>
										<div class="absolute top-1 right-0 left-0 text-xs">15</div></button
									>
								</div>
								<div class="hidden w-full text-right md:block">
									{formatTimeToHHMMSS($currentTime || 0)} | {formatTimeToHHMMSS($duration || 0)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Fullscreen Player -->
			<div
				class="animate-in fade-in-0 zoom-in-105 fixed inset-0 z-50 flex h-screen w-screen flex-col items-center justify-center bg-neutral-900 p-8 duration-200"
			>
				<!-- Close button -->
				<button
					aria-label="Close fullscreen player"
					on:click={toggleFullscreen}
					class="absolute top-6 right-6 text-3xl text-neutral-300 hover:text-white"
				>
					<iconify-icon icon="lucide:x"></iconify-icon>
				</button>

				<!-- Album Cover -->
				<div class="mb-8 w-full max-w-md">
					<img
						class="mx-auto h-64 w-64 rounded-lg object-cover shadow-2xl md:h-80 md:w-80"
						src={$currentTrack?.cover ?? 'https://i.imgur.com/3H81atT.jpeg'}
						alt="Album cover"
					/>
				</div>

				<!-- Track Info -->
				<div class="mb-6 text-center text-white">
					<h2 class="text-2xl font-bold md:text-3xl">{$currentTrack?.title || 'Unknown Title'}</h2>
					<p class="mt-2 text-lg text-neutral-400">
						{$currentTrack?.artist || 'Unknown Artist'}
					</p>
				</div>

				<!-- Progress Bar -->
				<div class="mb-8 w-full max-w-2xl px-4">
					<Slider
						class="mb-2"
						max={duration}
						progress={$currentTime && $duration ? ($currentTime / $duration) * 100 : 0}
						length={$duration}
						onSeeked={handleSeeked}
					/>
					<div class="flex justify-between text-sm text-neutral-400">
						<span>{formatTimeToHHMMSS($currentTime || 0)}</span>
						<span>{formatTimeToHHMMSS($duration || 0)}</span>
					</div>
				</div>

				<!-- Controls -->
				<div class="flex items-center justify-center space-x-8 text-white">
					<button
						aria-label="Previous track"
						on:click={handlePrev}
						class="text-3xl opacity-70 transition-opacity hover:opacity-100"
					>
						<iconify-icon icon="lucide:skip-back"></iconify-icon>
					</button>
					<button
						on:click={handleSeekBack}
						class="relative text-3xl opacity-70 transition-opacity hover:opacity-100"
					>
						<iconify-icon icon="lucide:rotate-ccw"></iconify-icon>
						<div class="absolute top-2 right-0 left-0 text-xs">15</div>
					</button>
					<button
						on:click={handlePlayPause}
						class="-mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl text-neutral-900 shadow-lg transition-transform hover:scale-105"
					>
						{#if $isPlaying}
							<iconify-icon icon="lucide:pause"></iconify-icon>
						{:else}
							<iconify-icon icon="lucide:play"></iconify-icon>
						{/if}
					</button>
					<button
						on:click={handleSeekForward}
						class="relative text-3xl opacity-70 transition-opacity hover:opacity-100"
					>
						<iconify-icon icon="lucide:rotate-cw"></iconify-icon>
						<div class="absolute top-2 right-0 left-0 text-xs">15</div>
					</button>
					<button
						aria-label="Next track"
						on:click={handleNext}
						class="text-3xl opacity-70 transition-opacity hover:opacity-100"
					>
						<iconify-icon icon="lucide:skip-forward"></iconify-icon>
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}
