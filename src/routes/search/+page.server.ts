import {
  yearOptions,
  lineNumberOptions,
  mTafsSearchFullFileCount,
  mTafsSearchFullCount,
  mTafsSearchPaged,
  type SearchParams
} from '$queries/search';
import { bureaus } from '$queries/tafs';
import { sortOptions } from '$config/search';

function convertArrayToSqlString(params: string[]) {
  // Our SQL expects an array of comma-separated values with no brackets or quotes
  return JSON.stringify(params).replace(/\[|"|\]/g, '');
}

/** @type {import('./$types').PageLoad} */
export const load = async ({ url }) => {
  // Shortcuts
  const u = (p: string) => url.searchParams.get(p);
  const ua = (p: string) => url.searchParams.getAll(p);

  // Paging values
  const pageSize = 50;
  const pageIndex = url.searchParams.has('page') ? Number(url.searchParams.get('page')) : 1;

  // Values we will only get when a search is done
  let resultCount, fileCount, results, resultsStart, resultsEnd;

  // Only perform our search once the form is submitted
  if (url.searchParams.toString().length) {
    // Get our arguments for our search queries.
    //
    // Note: Make sure to update the values in search/+page.svelte if the arguments
    // change.
    const agencyBureau = u('agencyBureau')?.split(',');
    const searchArgs: SearchParams = {
      term: u('term') || '',
      tafs: u('tafs') || '',
      bureau: agencyBureau?.pop() || '',
      agency: agencyBureau?.pop() || '',
      account: u('account') || '',
      approver: u('approver') || '',
      year: convertArrayToSqlString(url.searchParams.getAll('year')),
      approvedStart: u('approvedStart') ? new Date(`${u('approvedStart')}T00:00:00`) : undefined,
      approvedEnd: u('approvedEnd') ? new Date(`${u('approvedEnd')}T23:59:59`) : undefined,
      lineNum: convertArrayToSqlString(ua('lineNum')),
      footnoteNum: convertArrayToSqlString(ua('footnoteNum'))
    };
    const pagedSearchArgs = {
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      sort: url.searchParams.get('sort'),
      ...searchArgs
    };

    // Execute queries.  Important to memoize counts, less so for search.
    resultCount = await mTafsSearchFullCount(searchArgs);
    fileCount = await mTafsSearchFullFileCount(searchArgs);
    results = await mTafsSearchPaged(pagedSearchArgs);

    // Determine result numbers
    resultsStart = pageIndex * pageSize - pageSize + 1;
    resultsEnd = Math.min(resultCount, pageIndex * pageSize);
  }

  return {
    // Return numeric options as numbers
    yearOptions: await yearOptions(),
    lineOptions: await lineNumberOptions(),
    agencyBureauOptions: await bureaus(),
    sortOptions,
    pageSize,
    pageIndex,
    resultCount,
    fileCount,
    results: results,
    resultsStart,
    resultsEnd,
    pageMeta: {
      title: resultCount > 0 ? 'Search results' : 'Search apportionments',
      description:
        'Search apportionments by contents, TAFS, bureau, fiscal year, footnotes, and more',
      includeSearch: true
    }
  };
};
