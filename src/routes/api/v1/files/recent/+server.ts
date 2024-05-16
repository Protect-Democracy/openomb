// Dependencies
import { json } from '@sveltejs/kit';
import { recentlyApproved } from '$queries/files';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  // Any query parameters
  let limit = parseInt(url.searchParams.get('limit') || '50');
  limit = Math.min(limit, 1000);

  // Get files
  const files = await recentlyApproved();

  return json({
    query: {
      limit
    },
    results: files
  });
}
