<script>
	import { onMount } from 'svelte';

	let isDarkMode = false;

	onMount(() => {
		// Check localStorage for theme preference on mount
		const storedTheme = localStorage.getItem('theme');
		if (storedTheme) {
			isDarkMode = storedTheme === 'dark';
			applyTheme();
		} else {
			// Default to system preference if no stored theme
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			isDarkMode = prefersDark;
			applyTheme();
		}
	});

	function toggleTheme() {
		isDarkMode = !isDarkMode;
		applyTheme();
	}

	function applyTheme() {
		localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
			document.documentElement.classList.remove('light'); // Ensure light class is removed
		} else {
			document.documentElement.classList.remove('dark');
			document.documentElement.classList.add('light'); // Add light class for explicit light mode
		}
	}
</script>

<button
	aria-label="Toggle theme"
	on:click={toggleTheme}
	class="h-7 w-7 transform items-center justify-center rounded-full bg-neutral-300 text-base shadow ring-0 transition duration-200 ease-in-out dark:bg-neutral-700"
>
	<iconify-icon icon="lucide:sun" height="1.25em" class="dark:hidden"></iconify-icon>
	<iconify-icon icon="lucide:moon" height="1.25em" class="hidden dark:block"></iconify-icon>
</button>