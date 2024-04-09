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


  {#if data.results?.length}
    <UrlPagination url={$page.url} perPage={data.pageSize} total={data.resultCount} />
  {/if}


  <Results results={data.results} />

  {#if data.results?.length}
    <UrlPagination url={$page.url} perPage={data.pageSize} total={data.resultCount} />
  {/if}
</section>

<style>
</style>
