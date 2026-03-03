<script lang="ts">
  import { goto } from '$app/navigation';
import { formatDate } from '$lib/formatters';
import { parseUrlSearchParams, searchCriterionDescriptions } from '$lib/searches';
import { submitting } from './form-store';
import Drawer from '$components/drawer/Drawer.svelte';
import XSymbol from '$components/icons/XSymbol.svelte';
import Spinner from '$components/icons/Spinner.svelte';
import Form from './Form.svelte';

// Types
import type { BureausResult } from '$queries/agencies';
import type {
  YearOptionsResult,
  ApproverTitleOptionsResult,
  LineNumberOptionsResult
} from '$queries/search';

// Props
export let url: URL;
export let agencyBureauOptions: BureausResult = [];
export let yearOptions: YearOptionsResult = [];
export let lineOptions: LineNumberOptionsResult = [];
export let approverTitleOptions: ApproverTitleOptionsResult = [];

// Derived
$: submittingProxy = typeof $submitting !== 'undefined' ? $submitting : false;
$: parsedSearchParams = parseUrlSearchParams(url.searchParams);

// It might make sense to just use links instead of buttons, but given
// that this filter version doesn't show up for non-js users,
// it's not really necessary.
function removeFilter(filterParam: string, filterValue: string | number | Date) {
  const newParams = new URLSearchParams(url.searchParams.toString());

  // Custom param handling.  Term is an input with comma separated list of values.
  if (filterParam === 'term') {
    const terms =
      newParams
        .get(filterParam)
        ?.split(',')
        .map((t) => t.trim()) || [];
    const newTerms = terms.filter((t) => t !== filterValue);
    if (newTerms.length > 0) {
      newParams.set(filterParam, newTerms.join(', '));
    }
    else {
      newParams.delete(filterParam);
    }
  }
  else {
    newParams.delete(filterParam, filterValue.toString());
  }

  goto(`${url.pathname}?${newParams.toString()}`, { noScroll: true });
}

// Label for our filter toggle where %s is the current filter value
function getFilterLabel(
  key: string,
  value: string | number | Date | undefined | (string | number | Date)[]
) {
  if (value === null || value === undefined) {
    return false;
  }

  // See if the value is in the search criterion.
  let criterion = { [key]: value };
  const criterionDescription = searchCriterionDescriptions(criterion, {
    agencyBureauOptions: agencyBureauOptions,
    approverTitleOptions: approverTitleOptions
  });
  if (criterionDescription) {
    return criterionDescription[0];
  }

  // Things that may not be in the search criterion descriptions, but we still want to show a label for.
  else if (key === 'createdStart' && (value instanceof Date || typeof value === 'string')) {
    return `Added to OpenOMB after: ${formatDate(value)}`;
  }
  else if (key === 'createdEnd' && (value instanceof Date || typeof value === 'string')) {
    return `Added to OpenOMB before: ${formatDate(value)}`;
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
        <Form {url} {agencyBureauOptions} {yearOptions} {lineOptions} {approverTitleOptions} />
      </svelte:fragment>
    </Drawer>
  </div>

  <div class="filters">
    {#each Object.entries(parsedSearchParams) as [key, param] (key)}
      {@const params = Array.isArray(param) ? param : [param]}
      {#each params as value (value)}
        {@const formattedValue = Array.isArray(param) ? [value] : value}
        {#if value && getFilterLabel(key, formattedValue)}
          <button class="alt" on:click={() => removeFilter(key, value)}>
            <span class="sr-only"> Remove filter</span>

            {getFilterLabel(key, formattedValue)}

            <span class="icon">
              <XSymbol />
            </span>
          </button>
        {/if}
      {/each}
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
