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
  import { createPagination } from '@melt-ui/svelte';
  import { goto } from '$app/navigation';
  import { formatNumber } from '$lib/formatters';

  export let url;
  export let perPage = 1;
  export let total = 0;

  const pageStore = writable(Number(url?.searchParams.get('page')) || 1);

  const handlePageChange = ({ next }) => {
    const newQuery = new URLSearchParams(url?.searchParams.toString());
    newQuery.set('page', next);
    goto(`${url.pathname}?${newQuery.toString()}`, { noScroll: true });
    return next;
  };

  const {
    elements: { root, pageTrigger, prevButton, nextButton },
    states: { pages }
  } = createPagination({
    page: pageStore,
    count: total,
    perPage,
    defaultPage: 1,
    siblingCount: 1,
    onPageChange: handlePageChange
  });
</script>

{#if $pages.length > 1 && total > 0}
  <nav aria-label="pagination" {...$root} use:root>
    <div class="button-group">
      <button {...$prevButton} use:prevButton> &#x276e; </button>{#each $pages as page (page.key)}
        {#if page.type === 'ellipsis'}
          <button disabled>...</button>
        {:else if page.value !== 0}
          <button {...$pageTrigger(page)} class:active={$pageStore === page.value} use:pageTrigger>
            {formatNumber(page.value)}
          </button>
        {/if}
      {/each}<button {...$nextButton} use:nextButton> &#x276f; </button>
    </div>
  </nav>
{/if}

<style>
  .button-group button {
    padding: var(--spacing-half) var(--spacing);
    color: var(--color-text);
    background-color: var(--color-background);
    border: 1px solid var(--color-gray-dark);
    border-radius: 0;
    min-width: 0;
  }

  .button-group button:hover,
  .button-group button.active {
    color: var(--color-text-inverse);
    background-color: var(--color-background-inverse);
  }

  .button-group button + button {
    margin-left: -1px;
  }

  .button-group button:first-child {
    border-bottom-left-radius: 5px;
    border-top-left-radius: 5px;
  }

  .button-group button:last-child {
    border-bottom-right-radius: 5px;
    border-top-right-radius: 5px;
  }
</style>
