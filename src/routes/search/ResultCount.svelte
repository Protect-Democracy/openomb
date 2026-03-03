<script lang="ts">
  import { formatNumber } from '$lib/formatters';
import Spinner from '$components/icons/Spinner.svelte';

// Props
export let countLabel = 'accounts';
export let count: number | Promise<number>;
export let currentPage: number;
export let pageSize: number;

// Methods
function resultsStart() {
  return currentPage * pageSize - pageSize + 1;
}
function resultsEnd(count: number) {
  return Math.min(count || 0, currentPage * pageSize);
}
</script>

<div class="result-count">
  {#if count instanceof Promise}
    {#await count}
      <p class="muted" role="status">
        <span class="inline-icon"><Spinner /></span>
        Loading {countLabel} count
      </p>
    {:then count}
      <p role="status">
        Results
        {formatNumber(resultsStart())} -
        {formatNumber(resultsEnd(count))}
        of <strong>{formatNumber(count || 0)} {countLabel}</strong>
      </p>
    {/await}
  {:else if (count || 0) > 0}
    <p>
      Results
      {formatNumber(resultsStart())} -
      {formatNumber(resultsEnd(count))}
      of <strong>{formatNumber(count || 0)} {countLabel}</strong>
    </p>
  {/if}
</div>

<style>
  .result-count {
    display: flex;
    gap: var(--spacing);
  }

  @media (max-width: 768px) {
    .result-count {
      align-self: flex-start;
    }
  }
</style>
