<script lang="ts">
  import type { PageData } from './$types';
  import { formatFileTitle } from '$lib/formatters';

  export let data: PageData;
  $: ({ folder, agenciesByFolder, filesWithoutTafs } = data);
</script>

<div class="page-container">
  <h1>Folder: {folder.folder}</h1>

  <p>There are {folder.fileCount} files in this folder.</p>

  <h2>Agencies</h2>

  {#if agenciesByFolder && agenciesByFolder.length}
    <ul>
      {#each agenciesByFolder as agency}
        <li>
          <a href="/agency/{agency.budgetAgencyTitleId}">{agency.budgetAgencyTitle}</a>
          ({agency.fileCount})
        </li>
      {/each}
    </ul>
  {:else}
    <p>We were unable to find any agencies in this folder.</p>
  {/if}

  {#if filesWithoutTafs && filesWithoutTafs.length}
    <h2>Other files</h2>

    <p>
      The following files do not have agency data attached to them. This is likely caused because
      they were originally PDF files with limited data.
    </p>

    <ul>
      {#each filesWithoutTafs as file}
        <li><a href="/file/{file.fileId}">{formatFileTitle(file)}</a></li>
      {/each}
    </ul>
  {/if}
</div>
