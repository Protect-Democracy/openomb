<script lang="ts">
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
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

  function updateSort(event: Event) {
    const newQuery = new URLSearchParams(url.searchParams.toString());
    newQuery.set('sort', event.target.value);
    goto(`${url.pathname}?${newQuery.toString()}`, { noScroll: true });
  }
</script>

<svelte:head>
  <title>Search | {siteName}</title>
</svelte:head>

<section class="heading">
  <h1>Search Apportionments</h1>
</section>

{#if !url.searchParams.toString().length}
  <section class="form">
    <Form
      {url}
      agencyBureauOptions={data.agencyBureauOptions}
      yearOptions={data.yearOptions}
      lineOptions={data.lineOptions}
    />
  </section>
{:else}
  <section class="resultFilters">
    <Filters
      {url}
      agencyBureauOptions={data.agencyBureauOptions}
      yearOptions={data.yearOptions}
      lineOptions={data.lineOptions}
    />
  </section>

  <section class="results">
    <!-- Don't wait on search results to load page - show loading state instead -->
    {#await Promise.all([data.resultCount, data.results])}
      <p>Loading search results...</p>
    {:then [resultCount, results]}
      <aside class="result-actions">
        <strong>{formatNumber(resultCount)} Results</strong>
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

      <UrlPagination {url} perPage={data.pageSize} total={resultCount} />
    {:catch error}
      <p>
        Error loading search results: {error.message}
      </p>
    {/await}
  </section>
{/if}

<style>
  section {
    padding: 0 calc(var(--spacing-large) * 2);
  }

  section.heading {
    margin: 0 0 var(--spacing-large);
  }

  section.heading {
    text-align: center;
  }

  section:not(.heading) {
    border-top: 1px solid var(--color-gray-light);
    padding-top: var(--spacing-double);
    margin: 0 0 var(--spacing-double);
  }

  aside.result-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-double);
  }
</style>
