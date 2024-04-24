<script lang="ts">
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { formatNumber } from '$lib/formatters';
  import { siteName } from '$config';
  import Form from '../Form.svelte';
  import Filters from '../Filters.svelte';
  import Results from './Results.svelte';
  import UrlPagination from '$components/pagination/UrlPagination.svelte';

  export let data: PageData;

  // Linting issue workaround - https://github.com/sveltejs/eslint-plugin-svelte/issues/652
  // eslint-disable-next-line svelte/valid-compile
  $: url = $page.url;

  function updateSort(event: Event) {
    const newQuery = new URLSearchParams(url.searchParams.toString());
    newQuery.set('sort', event.target.value);
    goto(`${url.pathname}?${newQuery.toString()}`, { noScroll: true });
  }
</script>

<svelte:head>
  <title>Search | {siteName}</title>
</svelte:head>

<section class="page-container">
  <h1>Search Apportionments</h1>

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
            {formatNumber(resultCount)} Results in {formatNumber(fileCount)} Files
          </span>
          <div class="sort">
            <select
              name="sort"
              id="sort"
              title="Sort results"
              value={url.searchParams.get('sort') || 'approved_desc'}
              on:change={updateSort}
            >
              {#each data.sortOptions as option}
                <option value={option.key}>{option.label}</option>
              {/each}
            </select>
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

  aside.result-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: var(--spacing-double) 0;
  }

  .result-count {
    font-weight: 700;
  }
</style>
