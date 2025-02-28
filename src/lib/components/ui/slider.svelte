<!-- eslint-disable-next-line svelte/valid-compile -->
<script context="module" lang="ts">
	// clamp percentage value between 0 and 100
	function percentageClamp(value: number): number {
		return Math.min(Math.max(value, 0), 100);
	}

	export function formatTimeToHHMMSS(secondsTotal: number): string {
		const hours = Math.floor(secondsTotal / 3600);
		let minutes = (Math.floor(secondsTotal / 60) - hours * 60).toString().padStart(2, '0');
		let seconds = Math.floor(secondsTotal % 60)
			.toString()
			.padStart(2, '0');
		return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
	}
</script>

<script lang="ts">
	type SliderProps = {
		onSeeked: (percentage: number) => void;
		chapters: { size: number; text?: string }[];
		max: number;
		progress: number;
		buffer: number;
		length: number;
		seek: number;
		getThumbnail: ((seekPercent: number) => Promise<string | undefined> | undefined) | null;
		accentColor: string;
		class?: string;
	};

	let {
		onSeeked,
		chapters = [],
		progress,
		max,
		buffer,
		length,
		seek,
		getThumbnail,
		accentColor = '#007aff',
		class: sliderClass,
		...props
	}: SliderProps = $props();

	let seekbarElement: HTMLDivElement | null = null;

	let isSeeking = false;

	function handlePointerMove(
		event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }
	) {
		const progressPercent = percentageClamp(
			((event.pageX - event.currentTarget.getBoundingClientRect().left) /
				event.currentTarget.clientWidth) *
				100
		);
		if (isSeeking && seekbarElement) {
			seekbarElement.dispatchEvent(new CustomEvent('seeking', { detail: progressPercent }));
			progress = progressPercent;
		}
		seek = progressPercent;
	}

	function handlePointerLeave() {
		seek = 0;
	}

	function handlePointerDown(event: PointerEvent) {
		console.log('SEEKING+!!');
		isSeeking = true;
		handlePointerMove(event as PointerEvent & { currentTarget: EventTarget & HTMLDivElement }); // Type assertion for currentTarget
		if (event.pointerId && seekbarElement) seekbarElement.setPointerCapture(event.pointerId);
	}
	function handlePointerUp({ pointerId }: PointerEvent) {
		isSeeking = false;
		if (pointerId && seekbarElement) seekbarElement.releasePointerCapture(pointerId);
		if (seekbarElement) {
			console.log('seeked event dispatching!');
			seekbarElement.dispatchEvent(new CustomEvent('seeked', { detail: seek }));
			onSeeked(seek);
		}
	}

	let totalSize: number = chapters && 0;
	let processedChapters: { size: number; text?: string; offset: number; scale: number }[] =
		chapters.map(({ size, text }) => {
			const cloned = {
				// don't mutate the original chapters, bad idea if it's references to binary stuff like EBML
				size,
				text,
				offset: totalSize,
				scale: 100 / size
			};
			totalSize += size;
			return cloned;
		});

	function isThumbActive(currentProgress: number, currentSeek: number): boolean {
		for (const { offset, size } of processedChapters) {
			if (offset + size > currentProgress)
				return offset + size > currentSeek && offset < currentSeek;
		}
		return false; // Added return statement for all cases
	}
	function getCurrentChapterText(currentSeek: number): string {
		for (const { offset, size, text } of processedChapters) {
			if (offset + size > currentSeek)
				return (offset + size > currentSeek && offset <= currentSeek && text) || '';
		}
		return ''; // Added return statement for all cases
	}
	let thumbnail: string = '';

	async function updateThumbnail() {
		const initialSeek = seek;
		thumbnail = '';
		const newThumbnail = await getThumbnail?.(seek); // Optional chaining and null check
		if (initialSeek === seek) thumbnail = newThumbnail || '';
	}
	if (getThumbnail) updateThumbnail();
</script>

<div
	class="seekbar w-full {sliderClass}"
	bind:this={seekbarElement}
	on:pointerdown={handlePointerDown}
	on:pointerup={handlePointerUp}
	on:pointermove={handlePointerMove}
	on:pointerleave={handlePointerLeave}
	style:--accent={accentColor}
>
	{#each processedChapters as { size, offset, scale }}
		{@const seekPercent = percentageClamp((seek - offset) * scale)}
		<div style:width={size + '%'} class="chapter-wrapper">
			<!-- need to manually handle hovering as hovering while holding down pointer doesn't work across multiple elements -->
			<div class="chapter w-full" class:active={seekPercent > 0 && seekPercent < 100}>
				<div class="base-bar w-full" />
				<div class="base-bar" style:width={percentageClamp((buffer - offset) * scale) + '%'} />
				<div class="base-bar" style:width={seekPercent + '%'} />
				<div
					class="ps-progress-bar"
					style:width={percentageClamp((progress - offset) * scale) + '%'}
				/>
			</div>
		</div>
	{:else}
		<div class="chapter-wrapper w-full">
			<div class="chapter w-full rounded-xl">
				<div class="base-bar w-full" />
				<div class="base-bar" style:width={percentageClamp(buffer) + '%'} />
				<div class="base-bar" style:width={percentageClamp(seek) + '%'} />
				<div class="ps-progress-bar" style:width={percentageClamp(progress) + '%'} />
			</div>
		</div>
	{/each}
	<div class="thumb-container center" style:left={progress + '%'}>
		<div class="thumb" class:active={isThumbActive(progress, seek)} />
	</div>
	<div
		class="center hover-container"
		style:--progress={seek + '%'}
		style:--padding={getThumbnail ? '75px' : '15px'}
	>
		<div
			class="center rounded-xl border border-neutral-500 bg-neutral-300/80 px-1 tabular-nums backdrop-blur-sm"
		>
			<div>{getCurrentChapterText(seek) || ''}</div>
			<img alt="thumbnail" class="thumbnail" src={thumbnail} />
			{#if length}
				<div class="font-mono font-bold">{formatTimeToHHMMSS(length * (seek / 100))}</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.w-full {
		width: 100%;
	}
	.center {
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.seekbar {
		height: 25px;
		display: flex;
		flex-direction: row;
		cursor: pointer;
		user-select: none;
		touch-action: none;
		position: relative;
		font-weight: 500;
		font-size: 14px;
		color: #333;
		-webkit-touch-callout: none;
		-webkit-tap-highlight-color: #0000;
	}

	@media (pointer: fine) {
		.seekbar:hover .hover-container {
			display: flex;
		}
	}
	.hover-container {
		position: absolute;
		left: clamp(var(--padding), var(--progress), 100% - var(--padding)) !important;
		display: none;
		pointer-events: none;
		white-space: nowrap;
		text-shadow: 0 0 4px rgba(255, 255, 255, 1);
	}
	.hover-container > div {
		flex-direction: column;
		gap: 3px;
		position: absolute;
		bottom: -10px;
	}
	.thumbnail {
		width: 150px;
		bottom: 13px;
		border: #eee 2px solid;
		border-radius: 2px;
	}
	.thumbnail[src=''] {
		display: none;
	}
	.seekbar .thumb {
		width: 8px;
		height: 8px;
	}
	.seekbar:active {
		cursor: grabbing;
	}
	.seekbar:active .chapter div {
		filter: brightness(80%);
	}
	.seekbar:hover .thumb,
	.seekbar:active .thumb {
		width: 13px;
		height: 13px;
	}
	.seekbar:hover .thumb.active,
	.seekbar:active .thumb.active {
		width: 19px;
		height: 19px;
		filter: brightness(120%);
	}
	.thumb-container {
		position: absolute;
		bottom: 4.5px;
	}
	.thumb {
		width: 0;
		height: 0;
		background: var(--accent);
		position: absolute;
		border-radius: 50%;
		transition:
			width 0.1s cubic-bezier(0.4, 0, 1, 1),
			height 0.1s cubic-bezier(0.4, 0, 1, 1),
			filter 0.1s cubic-bezier(0.4, 0, 1, 1);
	}
	.chapter-wrapper {
		display: flex;
		align-items: end;
		position: relative;
		overflow: hidden;
	}
	.chapter-wrapper + .chapter-wrapper .chapter {
		left: 2px;
	}
	.chapter-wrapper + .chapter-wrapper .chapter div {
		left: -2px;
	}
	.chapter {
		height: 9px;
		display: flex;
		align-items: center;
		position: absolute;
		overflow: hidden;
		left: 0;
	}
	.chapter div {
		height: 3px;
		transition:
			height 0.1s cubic-bezier(0.4, 0, 1, 1),
			filter 0.1s cubic-bezier(0.4, 0, 1, 1);
		position: absolute;
	}
	.base-bar {
		background: rgba(255, 255, 255, 0.2);
	}
	.ps-progress-bar {
		background-color: var(--accent);
	}
	.chapter.active div {
		filter: brightness(120%);
		height: 9px !important;
	}
	.seekbar:hover .chapter div {
		height: 5px;
	}
</style>
