<script lang="ts">
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';
  import FileListingSmall from '$components/files/FileListingSmall.svelte';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';
  import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';

  export let data: PageData;
  $: ({ folder, agenciesByFolder, filesWithoutTafs, recentlyApproved, user, existingSubscription } =
    data);
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
      <h2>Other files</h2>

      <p>
        The following files do not have agency data attached to them. This is likely caused because
        they were originally PDF files with limited data.
      </p>

      {#each filesWithoutTafs as file}
        <FileListingSmall {file} />
      {/each}
    </section>
  {/if}

  <SubscribeLink {user} subType="folder" subItemId={folder.folderId} {existingSubscription} />

  <section class="page-section">
    <h2>Recently approved files</h2>

    <div class="recently-approved-files">
      {#each recentlyApproved as file}
        <FileListingSmall {file} />
      {/each}
    </div>
  </section>
</div>
