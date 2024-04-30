<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { formatNumber } from '$lib/formatters';
  import { siteName } from '$config';
  import Form from './Form.svelte';
  import Filters from './Filters.svelte';
  import Results from './Results.svelte';
  import UrlPagination from '$components/pagination/UrlPagination.svelte';

  export let data: PageData;

  // Linting issue workaround - https://github.com/sveltejs/eslint-plugin-svelte/issues/652
  // eslint-disable-next-line svelte/valid-compile
  $: url = $page.url;

  // State
  let sortFormEl: HTMLFormElement;
  let jsEnabled = false;
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

  // Mounting in browser
  onMount(() => {
    jsEnabled = true;
  });

  // A shortcut to quickly update data on sort change
  function updateSort() {
    sortFormEl.submit();
  }
</script>

<svelte:head>
  <title>Search | {siteName}</title>
</svelte:head>

<section class="page-container content-container" class:js-enabled={jsEnabled}>
  <h1>Search apportionments</h1>

  <p class="search-description">
    Apportionment files are a collection of accounts. Use the search on this page to search for
    accounts with files that match the search criteria.
  </p>

  {#if !url.searchParams.toString().length}
    <Form
      {url}
      agencyBureauOptions={data.agencyBureauOptions}
      yearOptions={data.yearOptions}
      lineOptions={data.lineOptions}
    />
  {:else}
    <div class="result-filters">
      <Filters
        {url}
        agencyBureauOptions={data.agencyBureauOptions}
        yearOptions={data.yearOptions}
        lineOptions={data.lineOptions}
      />
    </div>

    <div class="results">
      <!-- Don't wait on search results to load page - show loading state instead -->
      {#await Promise.all([data.resultCount, data.fileCount, data.results])}
        <p>Loading search results...</p>
      {:then [resultCount, fileCount, results]}
        <aside class="result-actions">
          <span class="result-count">
            Results: <strong>{formatNumber(resultCount)} accounts</strong> in
            <strong>{formatNumber(fileCount)} files</strong>
          </span>

          <div class="sort-action">
            <form
              action="{$page.url.pathname}{$page.url.search}"
              method="get"
              bind:this={sortFormEl}
            >
              <label for="sort">Sort results</label>

              <select
                name="sort"
                id="sort"
                value={url.searchParams.get('sort') || 'approved_desc'}
                on:change={updateSort}
              >
                {#each data.sortOptions as option}
                  <option value={option.key}>{option.label}</option>
                {/each}
              </select>

              {#each searchFormValues as value}
                <input type="hidden" name={value} value={url.searchParams.get(value)} />
              {/each}

              <button type="submit" class="small compact">Sort</button>
            </form>
          </div>
        </aside>

        <Results {results} />

        <div class="pagination">
          <UrlPagination {url} perPage={data.pageSize} total={resultCount} />
        </div>
      {:catch error}
        <p>
          Error loading search results: {error.message}
        </p>
      {/await}
    </div>
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

  .result-filters {
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
    margin: var(--spacing-double) 0 var(--spacing-large) 0;
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

  .js-enabled .sort-action button {
    display: none;
  }
</style>
