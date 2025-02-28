<script>
	export let href = '#';
	export let text = '';
</script>

<a
	{href}
	class="group w-screen max-w-max rounded-full bg-slate-300/30 px-3 transition-colors hover:bg-slate-400 dark:bg-slate-700/30 dark:hover:bg-slate-700"
>
	{text}
</a>
