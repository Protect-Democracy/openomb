<script lang="ts">
  import type { PageData } from './$types';
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { fileSortOptions, accountSortOptions } from '$config/search';

  import Form from './Form.svelte';
  import Filters from './Filters.svelte';
  import NoResults from './NoResults.svelte';
  import ScrollToTop from '$components/navigation/ScrollToTop.svelte';
  import { Tabs, Tab } from '$components/tabs';
  import FileListingHighlightable from '$components/files/FileListingHighlightable.svelte';
  import AccountListingHiglightable from '$components/accounts/AccountListingHiglightable.svelte';
  import ResultSort from './ResultSort.svelte';
  import ResultCount from './ResultCount.svelte';
  import ResultPaging from './ResultPaging.svelte';

  import { submitting } from './form-store';

  // Props
  export let data: PageData;

  // Stores
  const url = derived(page, ($page) => $page.url);

  // When we navigate on the client and JS enabled, we want to communicate
  // that the form is being submitted.
  beforeNavigate((navigation) => {
    // TODO: Is there a better way to compare path so it's not hardcoded like this?
    const from =
      navigation?.from?.url.pathname === $url.pathname ? navigation?.from?.url.href : null;
    const to = navigation?.from?.url.pathname === $url.pathname ? navigation?.to?.url.href : null;

    if (from && to && from !== to) {
      submitting.set(true);
    }
  });
  afterNavigate(() => {
    submitting.set(false);
  });

  // Derived
  // Linting issue workaround - https://github.com/sveltejs/eslint-plugin-svelte/issues/652
  // eslint-disable-next-line svelte/valid-compile
  $: ({ searchParams, files, fileCount, filePageSize, accounts, accountCount, accountPageSize } =
    data);
  $: hasFileResults = files && files.length > 0;
  $: hasAccountResults = accounts && accounts.length > 0;
  $: hasSearchParams = $url.searchParams.toString().length > 0;
  // TODO: Maybe be more specific about how we determine if search has been done.
  $: hasSearched = hasSearchParams && $url.searchParams.toString() !== 'term=';
  $: currentFilesPage = $url.searchParams.get('page') ? Number($url.searchParams.get('page')) : 1;
  $: currentAccountsPage = $url.searchParams.get('accountPage')
    ? Number($url.searchParams.get('accountPage'))
    : 1;
</script>

<div class="content-container">
  <div class="page-container">
    <h1>Search Appor&shy;tion&shy;ments</h1>

    <noscript>
      <div class="no-js-only-block" role="search">
        <div class="search-form">
          <Form
            url={$url}
            agencyBureauOptions={data.agencyBureauOptions}
            yearOptions={data.yearOptions}
            lineOptions={data.lineOptions}
            approverTitleOptions={data.approverTitleOptions}
          />
        </div>
      </div>
    </noscript>

    <div class="has-js-only-block" role="search">
      {#if hasSearched}
        <div class="search-filters">
          <Filters
            url={$url}
            agencyBureauOptions={data.agencyBureauOptions}
            yearOptions={data.yearOptions}
            lineOptions={data.lineOptions}
            approverTitleOptions={data.approverTitleOptions}
          />
        </div>
      {:else}
        <div class="search-form">
          <Form
            url={$url}
            agencyBureauOptions={data.agencyBureauOptions}
            yearOptions={data.yearOptions}
            lineOptions={data.lineOptions}
            approverTitleOptions={data.approverTitleOptions}
          />
        </div>
      {/if}
    </div>
  </div>

  {#if hasFileResults || hasAccountResults}
    <div class="results" id="results">
      <div id="file-results"></div>
      <div id="account-results"></div>

      <Tabs defaultTabId="file-results" url={$url}>
        <Tab label="File Results" id="file-results">
          {#if hasFileResults}
            <div class="page-container">
              <div class="heading-links">
                <h2>Files</h2>
              </div>
            </div>

            <aside class="result-actions-wrapper">
              <div class="result-actions page-container">
                <ResultCount
                  countLabel="files"
                  count={fileCount}
                  currentPage={currentFilesPage}
                  pageSize={filePageSize}
                />

                <div class="sort-action">
                  <ResultSort
                    id="sort"
                    anchor="file-results"
                    url={$url}
                    sortOptions={fileSortOptions}
                    defaultValue="approved_desc"
                  />
                </div>
              </div>
            </aside>

            <div class="file-list page-container">
              {#each files as file}
                <FileListingHighlightable {file} highlightParams={searchParams} />
              {/each}
            </div>

            <div class="page-container">
              <ResultPaging
                count={fileCount}
                pageSize={filePageSize}
                id="page"
                anchor="file-results"
              />
            </div>
          {:else if hasSearched}
            <div class="page-container">
              <h2>Files</h2>

              <div class="text-container no-results">
                <NoResults resultType="file" />
              </div>
            </div>
          {/if}
        </Tab>

        <Tab label="Account Results" id="account-results">
          {#if hasAccountResults}
            <div class="page-container">
              <div class="heading-links">
                <h2>Accounts</h2>
              </div>
            </div>

            <aside class="result-actions-wrapper">
              <div class="result-actions page-container">
                <ResultCount
                  countLabel="counts"
                  count={accountCount}
                  currentPage={currentAccountsPage}
                  pageSize={accountPageSize}
                />

                <div class="sort-action">
                  <ResultSort
                    id="accountSort"
                    anchor="account-results"
                    url={$url}
                    sortOptions={accountSortOptions}
                    defaultValue="account_asc"
                  />
                </div>
              </div>
            </aside>

            <div class="account-list page-container">
              <!-- There are technically accounts that have the same name with different casing,
              so the id's are the same, but the name is different.  Ideally this is fixed in
              data and/or the query, but for now we'll just use the index as well. -->
              {#each accounts as account, ai (`${account.accountTitleId}-${account.budgetAgencyTitleId}-${account.budgetBureauTitleId}-${ai}`)}
                <AccountListingHiglightable {account} highlightParams={searchParams} />
              {/each}
            </div>

            <div class="page-container">
              <ResultPaging
                count={accountCount}
                pageSize={accountPageSize}
                id="accountPage"
                anchor="account-results"
              />
            </div>
          {:else if hasSearched}
            <div class="page-container">
              <h2>Accounts</h2>

              <div class="text-container no-results">
                <NoResults resultType="account" />
              </div>
            </div>
          {/if}
        </Tab>
      </Tabs>
    </div>
  {/if}

  <ScrollToTop />
</div>

<style>
  .search-filters {
    margin: var(--spacing) 0;
    padding: var(--spacing) 0;
    border-top: 1px solid var(--color-gray-light);
    border-bottom: 1px solid var(--color-gray-light);
  }

  .heading-links {
    display: flex;
    justify-content: start;
    align-items: baseline;
  }

  .result-actions-wrapper {
    background-color: var(--color-background-alt);
    padding-top: var(--spacing);
    padding-bottom: var(--spacing);
    margin-bottom: var(--spacing-double);
  }

  .result-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    align-items: baseline;
  }

  .no-results {
    padding-top: var(--spacing-large);
    padding-bottom: var(--spacing-double);
    margin-left: auto;
    margin-right: auto;
  }

  .results {
    margin-bottom: var(--spacing-double);
  }

  .account-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-double);
    margin-bottom: var(--spacing-double);
  }

  .account-list > :global(article) {
    width: calc(50% - var(--spacing-double));
    border-bottom: var(--border-weight-thin) solid var(--color-gray-light);
    padding-right: var(--spacing);
    padding-bottom: var(--spacing-double);

    @media (max-width: 768px) {
      & {
        width: 100%;
      }
    }
  }

  .page-container :global(.file-listing-small) {
    border-bottom: var(--border-weight-thin) solid var(--color-gray-light);
    padding-bottom: var(--spacing);
    margin-bottom: var(--spacing-double);
  }

  @media (max-width: 768px) {
    .result-actions {
      flex-direction: column;
      row-gap: var(--spacing);
    }
  }
</style>
