<script lang="ts">
  import type { PageData } from './$types';
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';
  import { formatNumber } from '$lib/formatters';
  import Form from './Form.svelte';
  import Filters from './Filters.svelte';
  import NoResults from './NoResults.svelte';
  import UrlPagination from '$components/pagination/UrlPagination.svelte';
  import Spinner from '$components/icons/Spinner.svelte';
  import { submitting } from './form-store';
  import { afterNavigate, beforeNavigate } from '$app/navigation';

  import { fileSortOptions, accountSortOptions } from '$config/search';
  import ScrollToTop from '$components/navigation/ScrollToTop.svelte';
  import FileListingHighlightable from '$components/files/FileListingHighlightable.svelte';
  import AccountListingHiglightable from '$components/accounts/AccountListingHiglightable.svelte';

  // Props
  export let data: PageData;

  // Stores
  const url = derived(page, ($page) => $page.url);

  // State
  let fileSortFormEl: HTMLFormElement;
  let accountSortFormEl: HTMLFormElement;

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

  // A shortcut to quickly update data on sort change.
  // For some reason the submit doesn't trigger the navigation,
  // so do manually here.
  // TODO: Do this without a submit/page-reload
  function fileUpdateSort() {
    submitting.set(true);
    fileSortFormEl.submit();
  }
  function accountUpdateSort() {
    submitting.set(true);
    accountSortFormEl.submit();
  }
</script>

<div class="content-container">
  <div class="page-container">
    <h1>Search Apportionments</h1>

    <noscript>
      <div class="no-js-only-block" role="search">
        <div class="search-form">
          <Form
            url={$url}
            agencyBureauOptions={data.agencyBureauOptions}
            yearOptions={data.yearOptions}
            lineOptions={data.lineOptions}
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
          />
        </div>
      {:else}
        <div class="search-form">
          <Form
            url={$url}
            agencyBureauOptions={data.agencyBureauOptions}
            yearOptions={data.yearOptions}
            lineOptions={data.lineOptions}
          />
        </div>
      {/if}
    </div>
  </div>

  <section class="account-results" id="account-results">
    {#if hasAccountResults}
      <div class="page-container">
        <div class="heading-links">
          <h2>Accounts</h2>
          <a href="#file-results">Go to File results</a>
        </div>
      </div>

      <aside class="result-actions-wrapper">
        <div class="result-actions page-container">
          <div class="result-count">
            {#if accountCount instanceof Promise}
              {#await accountCount}
                <p class="muted" role="status">
                  <span class="inline-icon"><Spinner /></span>
                  Loading account count
                </p>
              {:then accountCount}
                <p role="status">
                  Results
                  {formatNumber(currentAccountsPage * accountPageSize - accountPageSize + 1)} - {formatNumber(
                    Math.min(accountCount || 0, currentAccountsPage * accountPageSize)
                  )}
                  of <strong>{formatNumber(accountCount || 0)} accounts</strong>
                </p>
              {/await}
            {:else if (accountCount || 0) > 0}
              <p>
                Results
                {formatNumber(currentAccountsPage * accountPageSize - accountPageSize + 1)} - {formatNumber(
                  Math.min(accountCount || 0, currentAccountsPage * accountPageSize)
                )}
                of <strong>{formatNumber(accountCount || 0)} accounts</strong>
              </p>
            {/if}
          </div>

          <div class="sort-action">
            <form
              action={`${$url.pathname}#account-results`}
              method="get"
              bind:this={accountSortFormEl}
            >
              <label for="account-sort">Sort results</label>

              <select
                name="accountSort"
                id="account-sort"
                value={$url.searchParams.get('accountSort') || 'account_asc'}
                on:change={accountUpdateSort}
              >
                {#each accountSortOptions as option (option.key)}
                  <option value={option.key}>{option.label}</option>
                {/each}
              </select>

              {#each $url.searchParams.keys() as param, pi (`${param}-${pi}`)}
                {#each $url.searchParams.getAll(param) as value}
                  {#if param !== 'accountSort'}
                    <input type="hidden" name={param} {value} />
                  {/if}
                {/each}
              {/each}

              <noscript>
                <div class="no-js-only-block">
                  <button type="submit" class="small compact">Sort</button>
                </div>
              </noscript>
            </form>
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

      <div class="pagination page-container">
        {#if accountCount instanceof Promise}
          {#await accountCount}
            <p class="muted center-container">
              <span class="inline-icon"><Spinner /></span>
              Loading paging...
            </p>
          {:then accountCount}
            <UrlPagination
              perPage={accountPageSize}
              total={accountCount}
              anchor="account-results"
              urlPageParam="accountPage"
            />
          {/await}
        {:else if (accountCount || 0) > 0}
          <UrlPagination
            perPage={accountPageSize}
            total={accountCount}
            anchor="account-results"
            urlPageParam="accountPage"
          />
        {/if}
      </div>
    {:else if hasSearched}
      <div class="page-container">
        <h2>Accounts</h2>

        <div class="text-container no-results">
          <NoResults resultType="account" />
        </div>
      </div>
    {/if}
  </section>

  <section class="file-results" id="file-results">
    {#if hasFileResults}
      <div class="page-container">
        <div class="heading-links">
          <h2>Files</h2>
          <a href="#account-results">Go to Account results</a>
        </div>
      </div>

      <aside class="result-actions-wrapper">
        <div class="result-actions page-container">
          <div class="result-count">
            {#if fileCount instanceof Promise}
              {#await fileCount}
                <p class="muted" role="status">
                  <span class="inline-icon"><Spinner /></span>
                  Loading file count
                </p>
              {:then fileCount}
                <p role="status">
                  Results
                  {formatNumber(currentFilesPage * filePageSize - filePageSize + 1)} - {formatNumber(
                    Math.min(fileCount || 0, currentFilesPage * filePageSize)
                  )}
                  of <strong>{formatNumber(fileCount || 0)} files</strong>
                </p>
              {/await}
            {:else if (fileCount || 0) > 0}
              <p>
                Results
                {formatNumber(currentFilesPage * filePageSize - filePageSize + 1)} - {formatNumber(
                  Math.min(fileCount || 0, currentFilesPage * filePageSize)
                )}
                of <strong>{formatNumber(fileCount || 0)} files</strong>
              </p>
            {/if}
          </div>

          <div class="sort-action">
            <form action={`${$url.pathname}#file-results`} method="get" bind:this={fileSortFormEl}>
              <label for="sort">Sort results</label>

              <select
                name="sort"
                id="sort"
                value={$url.searchParams.get('sort') || 'approved_desc'}
                on:change={fileUpdateSort}
              >
                {#each fileSortOptions as option (option.key)}
                  <option value={option.key}>{option.label}</option>
                {/each}
              </select>

              {#each $url.searchParams.keys() as param, pi (`${param}-${pi}`)}
                {#each $url.searchParams.getAll(param) as value}
                  {#if param !== 'sort'}
                    <input type="hidden" name={param} {value} />
                  {/if}
                {/each}
              {/each}

              <noscript>
                <div class="no-js-only-block">
                  <button type="submit" class="small compact">Sort</button>
                </div>
              </noscript>
            </form>
          </div>
        </div>
      </aside>

      <div class="file-list page-container">
        {#each files as file}
          <FileListingHighlightable {file} highlightParams={searchParams} />
        {/each}
      </div>

      <div class="pagination page-container">
        {#if fileCount instanceof Promise}
          {#await fileCount}
            <p class="muted center-container">
              <span class="inline-icon"><Spinner /></span>
              Loading paging...
            </p>
          {:then fileCount}
            <UrlPagination
              perPage={filePageSize}
              total={fileCount}
              anchor="file-results"
              urlPageParam="page"
            />
          {/await}
        {:else if (fileCount || 0) > 0}
          <UrlPagination
            perPage={filePageSize}
            total={fileCount}
            anchor="file-results"
            urlPageParam="page"
          />
        {/if}
      </div>
    {:else if hasSearched}
      <div class="page-container">
        <h2>Files</h2>

        <div class="text-container no-results">
          <NoResults resultType="file" />
        </div>
      </div>
    {/if}
  </section>

  <ScrollToTop />
</div>

<style>
  .pagination {
    margin: var(--spacing-double) auto;
    text-align: center;
  }

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

    a {
      font-size: var(--font-size-small);
      display: inline-block;
      margin-left: var(--spacing-double);
    }
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

  .result-count {
    display: flex;
    gap: var(--spacing);
  }

  .sort-action form {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .sort-action label {
    margin-right: var(--spacing);
  }

  .sort-action button {
    margin-left: var(--spacing);
  }

  .no-results {
    padding-top: var(--spacing-large);
    padding-bottom: var(--spacing-double);
    margin-left: auto;
    margin-right: auto;
  }

  .account-results {
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

    .result-count {
      align-self: flex-start;
    }
  }
</style>
