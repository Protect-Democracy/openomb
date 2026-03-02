import { error } from '@sveltejs/kit';
import {
  mYearOptions,
  mLineNumberOptions,
  mApproverTitleOptions,
  mFileSearchPaged,
  mFileSearchFullCount,
  mAccountSearchPaged,
  mAccountSearchFullCount,
  saveUserSearch,
  removeUserSearches,
  userSearch
} from '$queries/search';
import { parseUrlSearchParams } from '$lib/searches';
import { mBureaus } from '$queries/agencies';
import { mFolders } from '$queries/folders';
import { userSubscription } from '$queries/subscriptions';

// Types
import type { SearchPaginationParams, CombinedSearchCriterion } from '$queries/search';

/** @satisfies {import('./$types').Actions} */
export const actions = {
  // Add a saved search
  add: async ({ locals, request }) => {
    const user = (await locals.auth())?.user;
    if (!user || !user.email) {
      error(401, 'Must be authenticated to access this page');
    }

    const data = await request.json();
    // Add subscription
    if (data.criterion) {
      return await saveUserSearch(user.email, data.criterion);
    }
  },

  // Remove a saved search
  remove: async ({ locals, request }) => {
    const user = (await locals.auth())?.user;
    if (!user || !user.email) {
      error(401, 'Must be authenticated to access this page');
    }

    const data = await request.json();
    // Remove subscription
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
  const jsEnabled = !!cookies.get('jsEnabled');

  // Paging values
  const filePageSize = 50;
  const filePageIndex = h('page') ? Number(u('page')) : 1;
  const accountPageSize = 10;
  const accountPageIndex = h('accountPage') ? Number(u('accountPage')) : 1;

  // Values we will only get when a search is done
  let combinedSearchParams, fileCount, fileResults, accountCount, accountResults;

  // Only perform our search once the form is submitted.  From the landing page, an
  // empty query is in the form ?term= so we don't need to perform a search.
  const searchString = url.searchParams.toString();

  // User & subscription values
  const user = (await locals.auth())?.user;
  let existingSubscription;

  // Only do the search if we have search parameters, and not just an empty term, which happens
  // if the home page gets submitted without a search term.
  if (searchString && searchString !== 'term=') {
    // Saved search criterion
    const saveableSearchArgs = parseUrlSearchParams(url.searchParams);

    // Add supplemental search (not in the UI)
    const searchArgs: CombinedSearchCriterion = {
      ...saveableSearchArgs,

      // Included for email notification link, not used in form
      folder: u('folder') || '',
      createdStart: u('createdStart') ? new Date(`${u('createdStart')}T00:00:00`) : undefined,
      createdEnd: u('createdEnd') ? new Date(`${u('createdEnd')}T23:59:59`) : undefined
    };

    const pagedSearchArgs: SearchPaginationParams = {
      offset: (filePageIndex - 1) * filePageSize,
      limit: filePageSize,
      sort: u('sort') || undefined,
      accountOffset: (accountPageIndex - 1) * accountPageSize,
      accountLimit: accountPageSize,
      accountSort: u('accountSort') || undefined,
      ...searchArgs
    };

    // If we have search parameters, try getting an existing subscription
    // TODO: This needs to happen on the client as well, since the search can change with
    // out a page reload.
    const existingSearch = user && user.email ? await userSearch(user.email, searchArgs) : null;
    if (existingSearch && user && user.email) {
      existingSubscription = await userSubscription(user.email, 'search', existingSearch.id);
    }

    // Execute queries.  Important to memoize counts, less so for search.
    combinedSearchParams = pagedSearchArgs;
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
    searchParams: combinedSearchParams,
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
      title: combinedSearchParams ? 'Search results' : 'Search apportionments',
      description:
        'Search apportionments by contents, tafs, bureau, fiscal year, footnotes, and more',
      includeSearch: true
    }
  };
};
