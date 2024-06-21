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

/** @type {import('./$types').PageLoad} */
export const load = async ({ url, cookies }) => {
  // Shortcuts
  const u = (p: string) => url.searchParams.get(p);
  const h = (p: string) => url.searchParams.has(p);
  const ga = (p: string) => url.searchParams.getAll(p);
  const jsEnabled = !!cookies.get('jsEnabled');

  // Paging values
  const filePageSize = 50;
  const filePageIndex = h('page') ? Number(u('page')) : 1;
  const accountPageSize = 10;
  const accountPageIndex = h('accountPage') ? Number(u('accountPage')) : 1;

  // Values we will only get when a search is done
  let formattedSearchParams, fileCount, fileResults, accountCount, accountResults;

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
      accountSort: u('accountSort'),
      ...searchArgs
    };

    // Formatted search params
    formattedSearchParams = formatSearchParams(pagedSearchArgs);

    // Execute queries.  Important to memoize counts, less so for search.
    fileResults = await mFileSearchPaged(pagedSearchArgs);
    fileCount = jsEnabled
      ? mFileSearchFullCount(searchArgs)
      : await mFileSearchFullCount(searchArgs);
    accountResults = await mAccountSearchPaged(pagedSearchArgs);
    accountCount = jsEnabled
      ? mAccountSearchFullCount(searchArgs)
      : await mAccountSearchFullCount(searchArgs);
  }

  return {
    // Options/params
    searchParams: formattedSearchParams,
    yearOptions: await yearOptions(),
    lineOptions: await lineNumberOptions(),
    agencyBureauOptions: await bureaus(),

    // Files
    files: fileResults,
    fileCount,
    filePageSize,
    filePageIndex,

    // Accounts
    accounts: accountResults,
    accountCount: accountCount || 0,
    accountPageSize,
    accountPageIndex,

    // Page info
    pageMeta: {
      title: fileCount && fileCount > 0 ? 'Search results' : 'Search apportionments',
      description:
        'Search apportionments by contents, tafs, bureau, fiscal year, footnotes, and more',
      includeSearch: true
    }
  };
};
