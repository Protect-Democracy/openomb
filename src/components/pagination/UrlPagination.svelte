<!--
  Pagination using URL parameter

  Params
    - url: page URL object (with searchParams)
    - perPage: items per page
    - total: total number of items
  Slots
    None
-->

<script lang="ts">
  import { writable } from 'svelte/store';
  import { createPagination, melt } from '@melt-ui/svelte';
  import { goto } from '$app/navigation';
  import { formatNumber } from '$lib/formatters';

  export let url;
  export let perPage = 1;
  export let total = 0;

  const pageStore = writable(Number(url?.searchParams.get('page')) || 1);

  const handlePageChange = ({ curr, next }) => {
    const newQuery = new URLSearchParams(url?.searchParams.toString());
    newQuery.set('page', next);
    goto(`${url.pathname}?${newQuery.toString()}`, { noScroll: true });
    return next;
  };

  const {
    elements: { root, pageTrigger, prevButton, nextButton },
    states: { range, pages },
  } = createPagination({
    page: pageStore,
    count: total,
    perPage,
    defaultPage: 1,
    siblingCount: 1,
    onPageChange: handlePageChange,
  });
</script>

<nav
  aria-label="pagination"
  {...$root} use:root
>
  <p>
    <small>Showing {formatNumber($range.start)} - {formatNumber($range.end)} of {formatNumber(total)} total results</small>
  </p>
  <div>
    <button
      {...$prevButton} use:prevButton>&#x276e;</button
    >
    {#each $pages as page (page.key)}
      {#if page.type === 'ellipsis'}
        <span>...</span>
      {:else}
        <button
          {...$pageTrigger(page)} use:pageTrigger>{formatNumber(page.value)}</button
        >
      {/if}
    {/each}
    <button
      {...$nextButton} use:nextButton>&#x276f;</button
    >
  </div>
</nav>

<style>
  nav {
    text-align: center;
  }

  p {
    margin: auto;
    margin-bottom: var(--spacing-half);
  }

</style>
