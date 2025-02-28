<script>
	import Theme from '../theme.svelte';
import NavLink from './navLink.svelte';
	const Links = [
		{ text: 'Home', href: '/' },
		{ text: 'Episodes', href: '/episodes' },
//		{ text: 'About', href: '/about' },
//		{ text: 'Stuff To Enjoy', href: '/stuff' },
//		{ text: 'Bonus Support', href: '/bonus' },
//		{ text: 'Merch', href: '/merch' }
	];
</script>

<div class="my-4 border-b border-gray-500/50">
	<div
		class="flex w-full max-w-full justify-between space-x-4 overflow-x-auto pr-2 pb-2 text-lg text-nowrap text-gray-700 dark:text-gray-300"
	>
	<div class="flex-1 flex justify-start gap-4">
		{#each Links as link}
			<NavLink text={link.text} href={link.href} />
		{/each}
	</div>
		<Theme />
	</div>
</div>
