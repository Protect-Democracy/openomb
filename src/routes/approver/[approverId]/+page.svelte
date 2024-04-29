<script lang="ts">
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';
  import FileListingSmall from '$components/files/FileListingSmall.svelte';

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
        <FileListingSmall {file} />
      {/each}
    </div>
  </section>
</div>
