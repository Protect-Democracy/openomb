// Dependencies
import { json } from '@sveltejs/kit';
import { mFileSearchFullCount, mFileSearchPaged } from '$queries/search';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  const u = (p: string) => url.searchParams.get(p);
  const h = (p: string) => url.searchParams.has(p);
  const ga = (p: string) => url.searchParams.getAll(p);

  const filePageSize = Math.min(u('limit') ? Number(u('limit')) : 50, 100);
  const filePageIndex = h('page') ? Number(u('page')) : 1;

  const agencyBureau = url.searchParams.get('agencyBureau')?.split(',');
  const searchArgs = {
    term: u('term') || '',
    tafs: u('tafs') || '',
    bureau: agencyBureau?.[1] || '',
    agency: agencyBureau?.[0] || '',
    account: u('account') || '',
    approver: ga('approver').join(',') || '',
    year: ga('year').join(','),
    approvedStart: u('approvedStart') ? new Date(`${u('approvedStart')}T00:00:00`) : undefined,
    approvedEnd: u('approvedEnd') ? new Date(`${u('approvedEnd')}T23:59:59`) : undefined,
    apportionmentType: ga('apportionmentType').join(',') || '',
    lineNum: ga('lineNum').join(','),
    footnoteNum: ga('footnoteNum').join(','),
    folder: u('folder') || ''
  };
  const pagedSearchArgs = {
    offset: (filePageIndex - 1) * filePageSize,
    limit: filePageSize,
    sort: u('sort'),
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
