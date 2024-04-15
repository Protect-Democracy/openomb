<script lang="ts">
import { page } from '$app/stores';
import { siteName } from '$config';
import Form from './Form.svelte';
import Results from './Results.svelte';
import UrlPagination from '$components/pagination/UrlPagination.svelte'
export let data: PageData;
</script>

<svelte:head>
  <title>Search | {siteName}</title>
</svelte:head>

<section class="search">
  <h1>Search</h1>
  <Form searchParams={$page.url.searchParams} agencyBureauOptions={data.agencyBureauOptions} yearOptions={data.yearOptions} lineOptions={data.lineOptions} />
</section>

<section class="results">
  <h2>Results</h2>

  <!-- Don't wait on search results to load page - show loading state instead -->
  {#await Promise.all([data.resultCount, data.results])}
    <p>
      Loading search results...
    </p>
  {:then [resultCount, results]}
    <UrlPagination url={$page.url} perPage={data.pageSize} total={resultCount} />


    <Results results={results} />

    <UrlPagination url={$page.url} perPage={data.pageSize} total={resultCount} />
  {:catch error}
    <p>
      Error loading search results: {error.message}
    </p>
  {/await}
</section>

<style>
</style>
