<script lang="ts">
  import type { PageData } from './$types';
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';
  import { formatNumber } from '$lib/formatters';
  import Form from './Form.svelte';
  import Filters from './Filters.svelte';
  import UrlPagination from '$components/pagination/UrlPagination.svelte';
  import { submitting } from './form-store';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import ScrollToTop from '$components/navigation/ScrollToTop.svelte';
  import FileListingHighlightable from '$components/files/FileListingHighlightable.svelte';
  import AccountListingHiglightable from '$components/accounts/AccountListingHiglightable.svelte';

  // Props
  export let data: PageData;

  // Constants
  const accountLimit = 10;

  // Stores
  const url = derived(page, ($page) => $page.url);

  // State
  let sortFormEl: HTMLFormElement;

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

  // This seems annoying, but if we want the Sort form to be submittable without JS
  // we need to account for the values from the main Search form, as the GET action
  // on a form will remove existing query parameters.
  const searchFormParams = [
    'agencyBureau',
    'term',
    'tafs',
    'bureau',
    'agency',
    'account',
    'approver',
    'year',
    'approvedStart',
    'approvedEnd',
    'lineNum',
    'footnoteNum'
  ];

  // Derived
  // Linting issue workaround - https://github.com/sveltejs/eslint-plugin-svelte/issues/652
  // eslint-disable-next-line svelte/valid-compile
  $: ({ searchParams, files, fileCount, filePageSize, accounts } = data);
  $: hasFileResults = fileCount && fileCount > 0;
  $: hasAccountResults = accounts && accounts.length > 0;
  $: hasSearchParams = $url.searchParams.toString().length > 0;
  // TODO: Maybe be more specific about how we determine if search has been done.
  $: hasSearched = hasSearchParams && $url.searchParams.toString() !== 'term=';
  $: currentFilesPage = $url.searchParams.get('page') ? Number($url.searchParams.get('page')) : 1;

  // A shortcut to quickly update data on sort change
  function updateSort() {
    // For some reason the submit doesn't trigger the navigation,
    // so do manually here.
    submitting.set(true);
    sortFormEl.submit();
  }
</script>

<div class="content-container">
  <div class="page-container">
    <h1>Search Apportionments</h1>

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

  <section class="account-results">
    {#if hasAccountResults}
      <div class="page-container">
        <h2>Accounts</h2>
      </div>

      <aside class="result-actions-wrapper">
        <div class="result-actions page-container">
          <p role="status">
            Found <strong>{formatNumber(accounts?.length || 0)} accounts</strong>.
            {#if accounts?.length && accounts?.length > accountLimit}
              Showing first {formatNumber(accountLimit)}.
            {/if}
            <small><em>Still to implement pagination and sorting.</em></small>
          </p>
        </div>
      </aside>

      <div class="account-list page-container">
        {#each accounts as account (`${account.accountTitleId}-${account.budgetAgencyTitleId}-${account.budgetBureauTitleId}`)}
          <AccountListingHiglightable {account} highlightParams={searchParams} />
        {/each}
      </div>
    {:else if hasSearched}
      <div class="page-container">
        <h2>Accounts</h2>

        <p class="no-results">
          <em>No accounts were found from your criteria. Please try refining and try again.</em>
        </p>
      </div>
    {/if}
  </section>

  <section class="file-results">
    {#if hasFileResults}
      <div class="page-container">
        <h2>Files</h2>
      </div>

      <aside class="result-actions-wrapper">
        <div class="result-actions page-container">
          <div class="result-count">
            <p role="status">
              Results
              {formatNumber(currentFilesPage * filePageSize - filePageSize + 1)} - {formatNumber(
                Math.min(fileCount || 0, currentFilesPage * filePageSize)
              )}
              of <strong>{formatNumber(fileCount || 0)} files</strong>
            </p>
          </div>

          <div class="sort-action">
            <form action={$url.pathname} method="get" bind:this={sortFormEl}>
              <label for="sort">Sort results</label>

              <select
                name="sort"
                id="sort"
                value={$url.searchParams.get('sort') || 'approved_desc'}
                on:change={updateSort}
              >
                {#each data.sortOptions as option (option.key)}
                  <option value={option.key}>{option.label}</option>
                {/each}
              </select>

              {#each searchFormParams as param, index (index)}
                {#each $url.searchParams.getAll(param) as value}
                  <input type="hidden" name={param} {value} />
                {/each}
              {/each}

              <div class="no-js-only-block">
                <button type="submit" class="small compact">Sort</button>
              </div>
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
        <UrlPagination perPage={filePageSize} total={fileCount} />
      </div>
    {:else if hasSearched}
      <div class="page-container">
        <h2>Files</h2>

        <p class="no-results">
          <em>No files were found from your criteria. Please try refining and try again.</em>
        </p>
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
    text-align: center;
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
    padding-bottom: var(--spacing);
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
