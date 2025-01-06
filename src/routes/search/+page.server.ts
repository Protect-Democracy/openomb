import { redirect } from '@sveltejs/kit';
import { deserialize } from '$app/forms';
import {
  mYearOptions,
  mLineNumberOptions,
  mApproverTitleOptions,
  formatSearchParams,
  mFileSearchPaged,
  mFileSearchFullCount,
  mAccountSearchPaged,
  mAccountSearchFullCount,
  saveUserSearch,
} from '$queries/search';
import { bureaus } from '$queries/tafs';

/** @satisfies {import('./$types').Actions} */
export const actions = {
  save: async ({ locals, request }) => {
    const session = await locals.auth();
    const data = await request.json();
    // Add subscription
    if (session && data.criterion) {
      return await saveUserSearch(session.user.email, data.criterion);
    }
  },
  subscribe: async ({ locals, request, fetch }) => {
    const session = await locals.auth();
    const data = await request.text();
    const searchParams = new URLSearchParams(data);
    const criterion = {
      term: searchParams.get('term'),
      agencyBureau: searchParams.get('agencyBureau'),
      tafs: searchParams.get('tafs'),
      account: searchParams.get('account'),
      approver: searchParams.getAll('approver'),
      year: searchParams.getAll('year'),
      approvedStart: searchParams.get('approvedStart'),
      approvedEnd: searchParams.get('approvedEnd'),
      lineNum: searchParams.getAll('lineNum'),
      footnoteNum: searchParams.getAll('footnoteNum')
    }

    const resp = await fetch('/search?/save', {
      method: 'POST',
      headers: {
        'x-sveltekit-action': 'true'
      },
      body: JSON.stringify({ criterion }),
    });
    const newSearch = deserialize(await resp.text());

    // Add subscription
    if (newSearch.data.id) {
      redirect(303, `/subscribe/search/${newSearch.data.id}`);
    }
  },
};

/** @type {import('./$types').PageLoad} */
export const load = async ({ url, cookies, locals }) => {
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

  // Only perform our search once the form is submitted.  From the landing page, an
  // empty query is in the form ?term= so we don't need to perform a search.
  const searchString = url.searchParams.toString();
  if (searchString && searchString !== 'term=') {
    // Get our arguments for our search queries.
    //
    // Note: Make sure to update the values in search/+page.svelte if the arguments
    // change.
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
    yearOptions: await mYearOptions(),
    lineOptions: await mLineNumberOptions(),
    agencyBureauOptions: await bureaus(),
    approverTitleOptions: await mApproverTitleOptions(),

    // Files
    files: fileResults,
    fileCount: fileCount || 0,
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
