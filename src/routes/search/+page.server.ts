import {
  yearOptions,
  lineNumberOptions,
  formatSearchParams,
  mFileSearchPaged,
  mFileSearchFullCount,
  mAccountSearchPaged,
  mAccountSearchFullCount
} from '$queries/search';
import { bureaus } from '$queries/tafs';
import { sortOptions } from '$config/search';

/** @type {import('./$types').PageLoad} */
export const load = async ({ url }) => {
  // Shortcuts
  const u = (p: string) => url.searchParams.get(p);
  const h = (p: string) => url.searchParams.has(p);
  const ga = (p: string) => url.searchParams.getAll(p);

  // Paging values
  const filePageSize = 50;
  const filePageIndex = h('page') ? Number(u('page')) : 1;
  const accountPageSize = 10;
  const accountPageIndex = h('account-page') ? Number(u('account-page')) : 1;

  // Values we will only get when a search is done
  let formattedSearchParams,
    fileCount,
    fileResults,
    fileResultsStart,
    fileResultsEnd,
    accountCount,
    accountResults,
    accountResultsStart,
    accountResultsEnd;

  // Only perform our search once the form is submitted
  if (url.searchParams.toString().length) {
    // Get our arguments for our search queries.
    //
    // Note: Make sure to update the values in search/+page.svelte if the arguments
    // change.
    const agencyBureau = url.searchParams.get('agencyBureau')?.split(',');
    const searchArgs = {
      term: u('term') || '',
      tafs: u('tafs') || '',
      bureau: agencyBureau?.pop() || '',
      agency: agencyBureau?.pop() || '',
      account: u('account') || '',
      approver: u('approver') || '',
      year: ga('year').join(','),
      approvedStart: u('approvedStart') ? new Date(`${u('approvedStart')}T00:00:00`) : undefined,
      approvedEnd: u('approvedEnd') ? new Date(`${u('approvedEnd')}T23:59:59`) : undefined,
      lineNum: ga('lineNum').join(','),
      footnoteNum: ga('footnoteNum').join(',')
    };
    const pagedSearchArgs = {
      offset: (filePageIndex - 1) * filePageSize,
      limit: filePageSize,
      sort: u('sort'),
      accountOffset: (accountPageIndex - 1) * accountPageSize,
      accountLimit: accountPageSize,
      accountSort: u('account-sort'),
      ...searchArgs
    };

    // Formatted search params
    formattedSearchParams = formatSearchParams(pagedSearchArgs);

    // Execute queries.  Important to memoize counts, less so for search.
    fileResults = await mFileSearchPaged(pagedSearchArgs);
    fileCount = await mFileSearchFullCount(pagedSearchArgs);
    accountResults = await mAccountSearchPaged(pagedSearchArgs);
    accountCount = await mAccountSearchFullCount(pagedSearchArgs);

    // Determine result numbers
    fileResultsStart = filePageIndex * filePageSize - filePageSize + 1;
    fileResultsEnd = Math.min(fileCount, filePageIndex * filePageSize);
    accountResultsStart = accountPageIndex * accountPageSize - accountPageSize + 1;
    accountResultsEnd = Math.min(accountCount, accountPageIndex * accountPageSize);
  }

  return {
    // Options/params
    searchParams: formattedSearchParams,
    yearOptions: await yearOptions(),
    lineOptions: await lineNumberOptions(),
    agencyBureauOptions: await bureaus(),
    sortOptions,

    // Files
    files: fileResults,
    fileCount,
    filePageSize,
    filePageIndex,
    fileResultsStart,
    fileResultsEnd,

    // Accounts
    accounts: accountResults,
    accountCount: accountCount || 0,
    accountPageSize,
    accountPageIndex,
    accountResultsStart,
    accountResultsEnd,

    // Page info
    pageMeta: {
      title: fileCount && fileCount > 0 ? 'Search results' : 'Search apportionments',
      description:
        'Search apportionments by contents, tafs, bureau, fiscal year, footnotes, and more',
      includeSearch: true
    }
  };
};
