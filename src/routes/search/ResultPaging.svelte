<script lang="ts">
  import UrlPagination from '$components/pagination/UrlPagination.svelte';
import Spinner from '$components/icons/Spinner.svelte';

// Props
export let count: number | Promise<number>;
export let pageSize: number;
export let id: string;
export let anchor: string;
</script>

<div class="pagination">
  {#if count instanceof Promise}
    {#await count}
      <p class="muted center-container">
        <span class="inline-icon"><Spinner /></span>
        Loading paging...
      </p>
    {:then count}
      <UrlPagination perPage={pageSize} total={count} {anchor} urlPageParam={id} />
    {/await}
  {:else if (count || 0) > 0}
    <UrlPagination perPage={pageSize} total={count} {anchor} urlPageParam={id} />
  {/if}
</div>

<style>
  .pagination {
    margin: var(--spacing-double) auto;
    text-align: center;
  }
</style>
