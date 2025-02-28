<script lang="ts">
	import Episode from '$lib/components/episode.svelte';
	import { getCasts, type Cast, type Meta } from '$lib/stores/casts';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let castData: Cast[] = $state([]);
	let meta: Meta | null = $state(null);
	let currentPage = $state(1); // Use a different variable name to avoid confusion with $page store
	const limit = 15; // Episodes per page
	let totalPages = $state(1);
	let loading = $state(false);
	let error: Error | null = $state(null);

	async function loadEpisodes() {
		console.log('Loading episodes');
		loading = true;
		error = null;
		try {
			const result = await getCasts(currentPage, limit);
			castData = result.data;
			meta = result.meta;
			totalPages = result.totalPages;
			console.log('ballson');
		} catch (e) {
			error = e as Error;
			console.error('Error loading episodes:', e);
		} finally {
			loading = false;
		}
	}

	function handlePrevPage() {
		if (currentPage > 1) {
			const newPage = currentPage - 1;
			goto(`?page=${newPage}`);
		}
	}

	function handleNextPage() {
		if (currentPage < totalPages) {
			const newPage = currentPage + 1;
			goto(`?page=${newPage}`);
		}
	}

	onMount(() => {
		// Initialize currentPage from URL on mount
		const pageParam = page.url.searchParams.get('page');
		if (pageParam) {
			const parsedPage = parseInt(pageParam, 10);
			if (!isNaN(parsedPage) && parsedPage > 0) {
				currentPage = parsedPage;
			} else {
				currentPage = 1; // Default to page 1 if invalid param
			}
		} else {
			currentPage = 1; // Default to page 1 if no param
		}
		loadEpisodes();
	});

	$effect(() => {
		// Reactively update currentPage when URL page param changes
		const pageParam = page.url.searchParams.get('page');
		const parsedPage = parseInt(pageParam || '1', 10);
		console.log(parsedPage);
		if (!isNaN(parsedPage) && parsedPage > 0 && parsedPage !== currentPage) {
			currentPage = parsedPage;
			loadEpisodes(); // Load episodes when page param changes
		} else if (!pageParam && currentPage !== 1) {
			currentPage = 1; // Reset to page 1 if param is removed and currentPage is not already 1
			loadEpisodes();
		}
	});
</script>

<div class="space-y-2 pb-2 leading-relaxed">
	<h1 class="text-3xl font-semibold">Episodes</h1>
	<p>Welcome to our archive of episodes. Here you can find all the episodes we've released.</p>
</div>

{#if error}
	<div class="text-red-500">Error loading episodes: {error.message}</div>
{:else if loading}
	<div>Loading episodes...</div>
{:else}
	<div class="flex flex-col items-center space-y-2 pt-4">
		{#each castData as item}
			{#if meta}
				<Episode cast={item} {meta} />
			{/if}
		{/each}
	</div>

	<div class="my-4 flex justify-center space-x-4 py-4">
		<button
			on:click={handlePrevPage}
			disabled={currentPage <= 1}
			class="flex items-center justify-end rounded-full bg-slate-300 px-4 shadow-md transition-colors hover:bg-slate-400 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-700"
		>
			<iconify-icon icon="lucide:chevron-left" class="-ml-2 pr-2" />
			Previous Page
		</button>
		<button
			on:click={handleNextPage}
			disabled={currentPage >= totalPages}
			class="flex items-center justify-end rounded-full bg-slate-300 py-2 pl-4 text-base shadow-md transition-colors hover:bg-slate-400 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-700"
		>
			Next Page<iconify-icon icon="lucide:chevron-right" class="px-4" />
		</button>
	</div>

	<div class=" text-center text-sm text-neutral-500 dark:text-neutral-400">
		Page {currentPage} of {totalPages}
	</div>
{/if}
