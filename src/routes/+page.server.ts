import type { PageServerLoad } from './$types';
import { getCasts } from '$lib/stores/casts'; // Reuse the same logic

export const load: PageServerLoad = async ({ url }) => {
	const page = Number(url.searchParams.get('page') || 1);
	const limit = Number(url.searchParams.get('limit') || 3);
  
	// Fetch the paginated cast data
	const response = await getCasts(page, limit);

	const jan7 = await getCasts(1,1,"January 7, 2011")
	let res = {
		castData: response.data, 
		meta: response.meta, 
		page: response.page,
		limit: response.limit,
		totalPages: response.totalPages,
		jan7
	};
	
	// Return data to the Svelte component
	return res
  };