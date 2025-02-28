// src/routes/api/casts/+server.ts
import { json } from "@sveltejs/kit";
import { getCasts } from "$lib/stores/casts"; // Importing from lib/casts

/**
 * Handle GET requests for paginated cast data.
 */
export const GET = async ({ url }) => {
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Number(url.searchParams.get('limit') || 10);

  const response = await getCasts(page, limit);
  console.log("Response fetch")
  return json(response);
};