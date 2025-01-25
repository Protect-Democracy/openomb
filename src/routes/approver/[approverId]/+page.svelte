<script lang="ts">
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';
  import FileListingHighlightable from '$components/files/FileListingHighlightable.svelte';

  export let data: PageData;
  $: ({ approver, recentlyApproved } = data);
</script>

<div class="page-container content-container">
  <h1>Approver: {approver.approverTitle}</h1>

  <p>
    There are <strong>{formatNumber(approver.fileCount)} files</strong> associated with this approver.
  </p>

  <section class="page-section">
    <h2>Recently approved</h2>

    <div class="recently-approved-files">
      {#each recentlyApproved as file}
        <FileListingHighlightable {file} />
      {/each}
    </div>
  </section>
</div>

<style>
  .page-container :global(.file-listing-small) {
    border-bottom: var(--border-weight-thin) solid var(--color-gray-light);
    padding-bottom: var(--spacing);
    margin-bottom: var(--spacing-double);
  }

  .page-container :global(.file-listing-small:last-child) {
    border-bottom: none;
    padding-bottom: 0;
  }
</style>
