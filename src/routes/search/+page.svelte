<script lang="ts">
  import type { PageData } from './$types';
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';
  import { formatNumber, highlight } from '$lib/formatters';
  import Form from './Form.svelte';
  import Filters from './Filters.svelte';
  import UrlPagination from '$components/pagination/UrlPagination.svelte';
  import { submitting } from './form-store';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import ScrollToTop from '$components/navigation/ScrollToTop.svelte';
  import FileListingSmall from '$components/files/FileListingSmall.svelte';

  // Props
  export let data: PageData;

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
  const searchFormValues = [
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
  $: ({ count, files, searchParams, accounts } = data);
  $: hasResults = count && count > 0;
  $: hasSearchParams = $url.searchParams.toString().length > 0;
  // TODO: Maybe be more specific about how we determine if search has been done.
  $: hasSearched = hasSearchParams && $url.searchParams.toString() !== 'term=';

  $: formattedAccounts =
    accounts?.map((account) => ({
      id: account.accountTitleId,
      title: account.accountTitle,
      highlightedTitle: highlight(account.accountTitle, [searchParams.term])
    })) || [];

  // A shortcut to quickly update data on sort change
  function updateSort() {
    // For some reason this doesn't trigger the navigation
    submitting.set(true);

    sortFormEl.submit();
  }
</script>

<section class="page-container content-container">
  <h1>Search apportionments</h1>

  <p class="search-description">
    Apportionments are done at the account level. The best way to find an apportionment is to know
    the name or number (TAS or TAFS) of the account being apportioned. <!-- TODO: Link to FAW on how to find an account -->
  </p>

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

  {#if hasResults}
    <h2>Accounts</h2>

    <div class="account-results">
      {#each formattedAccounts as account, ai}
        {#if ai < 10}
          <a
            href="/agency/administrative-conference-of-the-united-states/bureau/administrative-conference-of-the-united-states/account/administrative-conference-of-the-us-salaries-and-expenses"
            class="account-result"
          >
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html account.highlightedTitle}
          </a>
        {/if}
      {/each}
    </div>

    <h2>Files</h2>

    <div class="results">
      <aside class="result-actions">
        <div class="result-count">
          <p role="status">
            Results: <strong>{formatNumber(count)} files</strong>.
          </p>

          <div class="font-small">
            <UrlPagination perPage={data.pageSize} total={count} includeLabel={false} />
          </div>
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

            {#each searchFormValues as value, index (index)}
              <input type="hidden" name={value} value={$url.searchParams.get(value)} />
            {/each}

            <div class="no-js-only-block">
              <button type="submit" class="small compact">Sort</button>
            </div>
          </form>
        </div>
      </aside>

      <div class="result-list">
        {#each files as file}
          <FileListingSmall {file} highlightParams={searchParams} />
        {/each}
      </div>

      <div class="pagination">
        <UrlPagination perPage={data.pageSize} total={count} />
      </div>

      <ScrollToTop />
    </div>
  {:else if hasSearched}
    <p class="no-results">
      <em>No results were found from your criteria. Please try refining and try again.</em>
    </p>
  {/if}
</section>

<style>
  .search-description {
    margin-bottom: var(--spacing-double);
  }

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

  .result-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    align-items: baseline;
    margin: 0 0 var(--spacing-large) 0;
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
    display: flex;
    flex-wrap: wrap;
  }

  .account-result {
    display: block;
    padding: 0 2rem 2rem 0;
    width: 33.333%;
  }

  .page-container :global(.file-listing-small) {
    margin-bottom: var(--spacing-large);
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
