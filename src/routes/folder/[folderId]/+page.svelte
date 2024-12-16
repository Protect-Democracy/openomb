<script lang="ts">
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';
  import FileListingHighlightable from '$components/files/FileListingHighlightable.svelte';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';

  export let data: PageData;
  $: ({ folder, agenciesByFolder, filesWithoutTafs, recentlyApproved } = data);
</script>

<div class="page-container">
  <Breadcrumbs>
    <BreadcrumbItem>
      <a href="/folders">Folders</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Folder: {folder.folder}
    </BreadcrumbItem>
  </Breadcrumbs>
</div>

<div class="page-container content-container">
  <h1>Folder: {folder.folder}</h1>

  <p>There are <strong>{formatNumber(folder.fileCount)}</strong> files in this folder.</p>

  <section class="page-section">
    <h2>Agencies</h2>

    {#if agenciesByFolder && agenciesByFolder.length}
      <ul>
        {#each agenciesByFolder as agency, aIndex}
          <li>
            <a href="/agency/{agency.budgetAgencyTitleId}">{agency.budgetAgencyTitle}</a>
            ({formatNumber(agency.fileCount)}{aIndex === 0 ? ' files' : ''})
          </li>
        {/each}
      </ul>
    {:else}
      <p>We were unable to find any agencies in this folder.</p>
    {/if}
  </section>

  {#if filesWithoutTafs && filesWithoutTafs.length}
    <section class="page-section">
      <h2>Letter apportionments</h2>

      <p>
        The following are Letter Apportionments and do not have agency and schedule data attached to
        them as there source is a PDF and not structured data from a spreadsheet.
      </p>

      {#each filesWithoutTafs as file}
        <FileListingHighlightable {file} />
      {/each}
    </section>
  {/if}

  <section class="page-section">
    <h2>Recently approved files</h2>

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
