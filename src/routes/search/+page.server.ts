import { error } from '@sveltejs/kit';
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
  removeUserSearches,
  mUserSearch
} from '$queries/search';
import { mBureaus } from '$queries/tafs';
import { mFolders } from '$queries/files';
import { mUserSubscription } from '$queries/subscriptions';

/** @satisfies {import('./$types').Actions} */
export const actions = {
  add: async ({ locals, request }) => {
    const user = (await locals.auth())?.user;
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    const data = await request.json();
    // Add subscription
    if (data.criterion) {
      return await saveUserSearch(user.email, data.criterion);
    }
  },
  remove: async ({ locals, request }) => {
    const user = (await locals.auth())?.user;
    if (!user) {
      error(401, 'Must be authenticated to access this page');
    }

    const data = await request.json();
    // Add subscription
    if (data.searchId) {
      return await removeUserSearches(user.email, data.searchId);
    }
  }
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

  // User & subscription values
  const user = (await locals.auth())?.user;
  let existingSubscription;

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
      apportionmentType: ga('apportionmentType').join(',') || '',
      lineNum: ga('lineNum').join(','),
      footnoteNum: ga('footnoteNum').join(','),

      // Included for email notification link, not used in form
      folder: u('folder') || '',
      createdStart: u('createdStart') ? new Date(`${u('createdStart')}T00:00:00`) : undefined,
      createdEnd: u('createdEnd') ? new Date(`${u('createdEnd')}T23:59:59`) : undefined
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

    // If we have search parameters, try getting an existing subscription
    const existingSearch = user ? await mUserSearch(user.email, searchArgs) : null;
    if (existingSearch) {
      existingSubscription = await mUserSubscription(user.email, 'search', existingSearch.id);
    }

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
    folders: await mFolders(),
    yearOptions: await mYearOptions(),
    lineOptions: await mLineNumberOptions(),
    agencyBureauOptions: await mBureaus(),
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

    //Subscription & user
    user,
    existingSubscription,

    // Page info
    pageMeta: {
      title: fileCount && fileCount > 0 ? 'Search results' : 'Search apportionments',
      description:
        'Search apportionments by contents, tafs, bureau, fiscal year, footnotes, and more',
      includeSearch: true
    }
  };
};
