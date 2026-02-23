<!--
  Pagination using URL parameter

  Note: Originally this was done with MeltUI's pagination
  functionality but it let to weird behavior with stores.

  Params
    - url: page URL object (with searchParams)
    - perPage: items per page
    - total: total number of items
  Slots
    None
-->

<script lang="ts">
  import { derived } from 'svelte/store';
import { page } from '$app/stores';
import { formatNumber } from '$lib/formatters';

// Constants
const itemId = (Math.random() + 1).toString(36).substring(7);

// Props
export let urlPageParam = 'page';
export let perPage = 50;
export let total = 0;
export let pageBuffer = 2;
export let includeLabel = true;
export let anchor = '';

// Stores
const url = derived(page, ($page) => $page.url);

// Derived
$: currentPage = $url.searchParams.get(urlPageParam)
  ? Number($url.searchParams.get(urlPageParam))
  : 1;
$: pagesLength = Math.ceil(total / perPage);
$: pages = makePages(pagesLength, currentPage, pageBuffer);

// Make pages
function makePages(
  pagesLength: number,
  currentPage: number,
  pageBuffer: number
): { value: number; type?: 'ellipsis' }[] {
  if (pagesLength <= 1) {
    return [{ value: 1 }];
  }

  pages = [];
  for (let i = 1; i <= pagesLength; i++) {
    // Only do:
    // - a certain amount around the current page,
    // - last and first,
    if (
      (i >= currentPage - pageBuffer && i <= currentPage + pageBuffer) ||
      i === 1 ||
      i === pagesLength
    ) {
      pages.push({ value: i });
    }
    // Add later ellipses
    else if (i === currentPage + pageBuffer + 1) {
      pages.push({ value: i, type: 'ellipsis' });
    }
    // Add early ellipses
    else if (i === currentPage - pageBuffer - 1) {
      pages.push({ value: i, type: 'ellipsis' });
    }
  }

  return pages;
}

// Check if valid page
function isValidPage(pageNumber: number) {
  return pageNumber > 0 && pageNumber <= pagesLength;
}

// Make url for a specific page
function getPageUrl(pageNumber: number) {
  const newQuery = new URLSearchParams($url.searchParams.toString());
  newQuery.set(urlPageParam, pageNumber.toString());
  return `${$url.pathname}?${newQuery.toString()}${anchor ? '#' + anchor : ''}`;
}
</script>

{#if pages.length > 1 && total > 0}
  {#if includeLabel}
    <label for="pagination-{itemId}"
      >Showing results {formatNumber(currentPage * perPage - perPage + 1)} - {formatNumber(
        Math.min(total, currentPage * perPage)
      )}</label
    >
  {/if}
  <nav id="pagination-{itemId}" aria-label="pagination">
    <div class="button-group">
      <svelte:element
        this={isValidPage(currentPage - 1) ? 'a' : 'span'}
        class="page-link-like"
        href={getPageUrl(currentPage - 1)}
        aria-label="Previous"
      >
        &#x276e;
      </svelte:element>

      {#each pages as availablePage (availablePage.value)}
        {#if availablePage.type === 'ellipsis'}
          <span class="ellipsis">...</span>
        {:else if availablePage.value !== 0}
          <a
            href={getPageUrl(availablePage.value)}
            class="page-link-like"
            class:active={availablePage.value === currentPage}
            class:like-text={availablePage.value === currentPage}
            aria-label={availablePage.value === currentPage
              ? 'Current page'
              : `Page ${formatNumber(availablePage.value)}`}
          >
            {formatNumber(availablePage.value)}
          </a>
        {/if}
      {/each}
      <svelte:element
        this={isValidPage(currentPage + 1) ? 'a' : 'span'}
        class="page-link-like"
        href={getPageUrl(currentPage + 1)}
        aria-label="Next"
      >
        &#x276f;
      </svelte:element>
    </div>
  </nav>
{/if}

<style>
  label {
    font-weight: normal;
  }

  .page-link-like {
    padding: 0 var(--spacing-half);
  }

  .ellipsis {
    font-weight: bold;
    padding: 0 var(--spacing-half);
  }

  a.active {
    color: var(--color-text);
    font-weight: var(--font-copy-weight-bolder);
    text-decoration: underline;
  }
</style>
