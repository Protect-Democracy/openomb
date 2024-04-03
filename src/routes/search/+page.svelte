<script lang="ts">
import { page } from '$app/stores';
import Form from './Form.svelte';
import Results from './Results.svelte';
import UrlPagination from '$components/pagination/UrlPagination.svelte'
export let data: PageData;
</script>

<section class="search">
  <h1>Search</h1>
  <Form searchParams={$page.url.searchParams} yearOptions={data.yearOptions} lineOptions={data.lineOptions} />
</section>

<section class="results">
  <h2>Results</h2>


  <nav class="pagination">
    <small>Showing {data.results.length} of {data.resultCount} total results</small>
    <UrlPagination url={$page.url} pageSize={data.pageSize} resultCount={data.resultCount} />
  </nav>


  <Results results={data.results} />

  <nav class="pagination">
    <UrlPagination url={$page.url} pageSize={data.pageSize} resultCount={data.resultCount} />
  </nav>
</section>

<style>
  .pagination {
    display: flex;
    flex-direction:column;
    align-items: center;
    text-align: center;
  }
</style>
