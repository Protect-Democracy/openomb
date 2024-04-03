<script lang="ts">
  export let url;
  export let pageSize = 1;
  export let resultCount = 0;
  let pageIndex = 1;

  let maxPages, prevQuery, nextQuery;

  $: maxPages = Math.trunc(resultCount / pageSize) + 1;
  $: pageIndex = Number(url.searchParams.get('page')) || 1;

  $: {
    prevQuery = new URLSearchParams(url.searchParams.toString());
    prevQuery.set('page', pageIndex - 1);
    nextQuery = new URLSearchParams(url.searchParams.toString());
    nextQuery.set('page', pageIndex + 1);
  }
</script>

<ul>
  <li>
    {#if pageIndex > 1}
      <a href={url.pathname + '?' + prevQuery.toString()}>&#x276e; Prev</a>
    {/if}
  </li>

  <li>Page {pageIndex}</li>

  <li>
    {#if pageIndex < maxPages}
      <a href={url.pathname + '?' + nextQuery.toString()}>Next &#x276f;</a>
    {/if}
  </li>
</ul>

<style>
  ul {
    margin: var(--spacing-half);
    padding: 0;
    list-style: none;
    display: flex;
  }

  li {
    min-width: var(--spacing);
    margin: 0 var(--spacing);
  }
</style>
