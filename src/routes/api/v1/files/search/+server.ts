// Dependencies
import { json } from '@sveltejs/kit';
import { mFileSearchFullCount, mFileSearchPaged } from '$queries/search';
import { parseUrlSearchParams } from '$lib/searches';

// Types
import type { SearchPaginationParams } from '$queries/search';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const u = (p: string) => url.searchParams.get(p);
  const h = (p: string) => url.searchParams.has(p);

  const filePageSize = Math.min(u('limit') ? Number(u('limit')) : 50, 100);
  const filePageIndex = h('page') ? Number(u('page')) : 1;

  const searchArgs = parseUrlSearchParams(url.searchParams);
  const pagedSearchArgs: SearchPaginationParams = {
    offset: (filePageIndex - 1) * filePageSize,
    limit: filePageSize,
    sort: u('sort') || undefined,
    ...searchArgs
  };

  // Get count and files
  const fileCount = await mFileSearchFullCount(searchArgs);
  const files = await mFileSearchPaged(pagedSearchArgs);

  return json({
    query: Object.fromEntries(url.searchParams.entries()),
    paging: {
      page: filePageIndex,
      offset: (filePageIndex - 1) * filePageSize,
      pages: Math.ceil(fileCount / filePageSize),
      size: filePageSize,
      count: fileCount || 0
    },
    results: files
  });
}
