<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatDate } from '$lib/formatters';
  import Drawer from '$components/drawer/Drawer.svelte';
  import Form from './Form.svelte';

  export let url;
  export let agencyBureauOptions = [];
  export let yearOptions = [];
  export let lineOptions = [];

  function removeFilter(filterParam: string) {
    const newParams = new URLSearchParams(url.searchParams.toString());
    newParams.delete(filterParam);
    goto(`${url.pathname}?${newParams.toString()}`, { noScroll: true });
  }

  // Label for our filter toggle where %s is the current filter value
  function getFilterLabel(key, value) {
    if (key === 'term') {
      return `Keyword "${value}"`;
    } else if (key === 'agencyBureau') {
      const ids = value.split(',');
      return agencyBureauOptions.find(
        (option) => option.budgetAgencyTitleId == ids[0] && option.budgetBureauTitleId == ids[1]
      )?.budgetBureauTitle;
    } else if (key === 'tafs') {
      return `TAFS "${value}"`;
    } else if (key === 'account') {
      return `Account "${value}"`;
    } else if (key === 'approver') {
      return `Approved by "${value}"`;
    } else if (key === 'year') {
      return `Fiscal year ${value}`;
    } else if (key === 'approvedStart') {
      return `Approved after ${formatDate(value)}`;
    } else if (key === 'approvedEnd') {
      return `Approved before ${formatDate(value)}`;
    } else if (key === 'lineNum') {
      return `Lines ${value.replace(/\[|"|\]/g, '')}`;
    } else if (key === 'footnoteNum') {
      return `Has Footnote ${value}`;
    }

    return false;
  }
</script>

<div class="bar">
  <div class="search-toggle">
    <Drawer contentTitle="Search Apportionments">
      <svelte:fragment slot="trigger">Adjust Search</svelte:fragment>
      <svelte:fragment slot="content">
        <Form {url} {agencyBureauOptions} {yearOptions} {lineOptions} />
      </svelte:fragment>
    </Drawer>
  </div>

  <div class="filters">
    {#each url.searchParams.entries() as [key, value]}
      {#if value?.length && value !== '[]' && getFilterLabel(key, value)}
        <button class="variant" on:click={() => removeFilter(key)}
          >{getFilterLabel(key, value)} (x)</button
        >
      {/if}
    {/each}
  </div>
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    column-gap: var(--spacing);
  }

  .search-toggle {
    flex: 0 0 auto;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    row-gap: var(--spacing-half);
    column-gap: var(--spacing-half);
  }

  .filters button {
    flex-grow: 0;
    font-size: var(--font-size-small);
    padding: var(--spacing-small) var(--spacing-half);
  }
</style>
