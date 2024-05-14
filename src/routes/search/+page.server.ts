import { yearOptions, lineNumberOptions, fileSearchTest, accountSearchTest } from '$queries/search';
import { bureaus } from '$queries/tafs';
import { sortOptions } from '$config/search';
import type { PageServerData } from '../$types';

function convertArrayToSqlString(params: string[]) {
  // Our SQL expects an array of comma-separated values with no brackets or quotes
  return JSON.stringify(params).replace(/\[|"|\]/g, '');
}

/** @type {import('./$types').PageLoad} */
export const load: PageServerData = async ({ url }) => {
  const pageSize = 50;
  const pageIndex = url.searchParams.has('page') ? Number(url.searchParams.get('page')) : 1;
  let searchResults;
  let accountResults;
  let searchArgs;

  const startDateString = url.searchParams.get('approvedStart')
    ? url.searchParams.get('approvedStart')
    : '2020-01-01';
  const endDateString = url.searchParams.get('approvedEnd');

  // Only perform our search once the form is submitted
  if (url.searchParams.toString().length) {
    // Get our arguments for our search queries.
    //
    // Note: Make sure to update the values in search/+page.svelte if the arguments
    // change.
    const agencyBureau = url.searchParams.get('agencyBureau')?.split(',');
    searchArgs = {
      term: url.searchParams.get('term') || '',
      tafs: url.searchParams.get('tafs') || '',
      bureau: agencyBureau?.pop() || '',
      agency: agencyBureau?.pop() || '',
      account: url.searchParams.get('account') || '',
      approver: url.searchParams.get('approver') || '',
      year: convertArrayToSqlString(url.searchParams.getAll('year')),
      approvedStart: new Date(`${startDateString}T00:00:00`),
      approvedEnd: endDateString ? new Date(`${endDateString}T23:59:59`) : new Date(),
      lineNum: convertArrayToSqlString(url.searchParams.getAll('lineNum')),
      footnoteNum: convertArrayToSqlString(url.searchParams.getAll('footnoteNum'))
    };

    const pagedSearchArgs = {
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      sort: url.searchParams.get('sort'),
      ...searchArgs
    };

    searchResults = await fileSearchTest(pagedSearchArgs);
    accountResults = await accountSearchTest(pagedSearchArgs);
  }

  // Get our options
  const allYearOptions = await yearOptions();
  const lineOptions = await lineNumberOptions();
  const agencyBureauOptions = await bureaus();

  return {
    searchParams: searchResults?.formattedSearchParams,
    yearOptions: allYearOptions,
    lineOptions,
    agencyBureauOptions,
    sortOptions,
    count: searchResults?.count,
    files: searchResults?.files,
    accounts: accountResults?.accounts,
    pageSize,
    pageIndex,
    pageMeta: {
      title: 'Search apportionments',
      description:
        'Search apportionments by contents, tafs, bureau, fiscal year, footnotes, and more',
      includeSearch: true
    }
  };
};
