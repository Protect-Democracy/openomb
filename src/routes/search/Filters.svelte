<script lang="ts">
  import { goto } from '$app/navigation';
  import { formatDate } from '$lib/formatters';
  import Drawer from '$components/drawer/Drawer.svelte';
  import XSymbol from '$components/icons/XSymbol.svelte';
  import Spinner from '$components/icons/Spinner.svelte';
  import { submitting } from './form-store';
  import Form from './Form.svelte';

  // Props
  export let url: URL;
  export let user;
  export let folders = [];
  export let agencyBureauOptions = [];
  export let yearOptions: number[] = [];
  export let lineOptions: string[] = [];
  export let approverTitleOptions: Record<'value' | 'label', string>[] = [];

  // Derived
  // eslint-disable-next-line svelte/valid-compile
  $: submittingProxy = typeof $submitting !== 'undefined' ? $submitting : false;

  // It might make sense to just use links instead of buttons, but given
  // that this filter version doesn't show up for non-js users,
  // it's not really necessary.
  function removeFilter(filterParam: string, filterValue: string) {
    const newParams = new URLSearchParams(url.searchParams.toString());
    newParams.delete(filterParam, filterValue);
    goto(`${url.pathname}?${newParams.toString()}`, { noScroll: true });
  }

  // Label for our filter toggle where %s is the current filter value
  function getFilterLabel(key, value) {
    if (key === 'term') {
      return `Keyword "${value}"`;
    } else if (key === 'folder') {
      // Include folder for email results (view all link)
      return `Folder "${folders.find((f) => f.folderId === value)?.folder}"`;
    } else if (key === 'agencyBureau') {
      const ids = value.split(',');
      // Handle just Agency or Agency/Bureau
      return ids.length === 1
        ? agencyBureauOptions.find((option) => option.budgetAgencyTitleId == ids[0])
            ?.budgetAgencyTitle
        : ids.length === 2
          ? agencyBureauOptions.find(
              (option) =>
                option.budgetAgencyTitleId == ids[0] && option.budgetBureauTitleId == ids[1]
            )?.budgetBureauTitle
          : undefined;
    } else if (key === 'tafs') {
      return `TAFS "${value}"`;
    } else if (key === 'account') {
      return `Account "${value}"`;
    } else if (key === 'approver') {
      return `Approved by "${value.split(',').map((v) => approverTitleOptions.find((o) => o.value === v)?.label)}"`;
    } else if (key === 'year') {
      return `Fiscal year ${value}`;
    } else if (key === 'approvedStart') {
      return `Approved after ${formatDate(value)}`;
    } else if (key === 'approvedEnd') {
      return `Approved before ${formatDate(value)}`;
    } else if (key === 'apportionmentType') {
      return `Apportionment Type ${value}`;
    } else if (key === 'lineNum') {
      return `Line ${value.replace(/[^0-9]+/g, '')}`;
    } else if (key === 'footnoteNum') {
      return `Has Footnote ${value}`;
    }

    return false;
  }
</script>

<div class="bar">
  <div class="search-toggle">
    <Drawer contentTitle="Refine Results" triggerProps={{ disabled: !!submittingProxy }}>
      <svelte:fragment slot="trigger">
        <span>
          {#if submittingProxy}
            <span class="button-icon"><Spinner /></span>
            Loading
          {:else}
            Refine results
          {/if}
        </span>
      </svelte:fragment>

      <svelte:fragment slot="title">
        <h2 class="h3-alt drawer-title">Refine Results</h2>
      </svelte:fragment>

      <svelte:fragment slot="description"
        ><p class="sr-only">Use the inputs below to search apportionments</p></svelte:fragment
      >

      <svelte:fragment slot="content">
        <Form
          {url}
          {user}
          {agencyBureauOptions}
          {yearOptions}
          {lineOptions}
          {approverTitleOptions}
        />
      </svelte:fragment>
    </Drawer>
  </div>

  <div class="filters">
    {#each url.searchParams.entries() as [key, value]}
      {#if value?.length && value !== '[]' && getFilterLabel(key, value)}
        <button class="alt" on:click={() => removeFilter(key, value)}>
          <span class="sr-only"> Remove filter</span>
          {getFilterLabel(key, value)}
          <span class="icon">
            <XSymbol />
          </span>
        </button>
      {/if}
    {/each}
  </div>
</div>

<style>
  .bar {
    display: flex;
    align-items: flex-start;
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
    min-width: auto;
  }

  .icon {
    display: inline-block;
    width: 0.9em;
    height: 0.9em;
    vertical-align: text-top;
    margin-left: var(--spacing-half);
  }

  .drawer-title {
    text-align: center;
    padding-left: var(--spacing-double);
    padding-right: var(--spacing-double);
    margin-bottom: var(--spacing-double);
  }

  @media (max-width: 768px) {
    .bar {
      flex-direction: column;
      row-gap: var(--spacing-half);
    }
  }
</style>
