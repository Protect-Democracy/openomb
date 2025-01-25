<script lang="ts">
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';
  import FileListingHighlightable from '$components/files/FileListingHighlightable.svelte';
  import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';

  export let data: PageData;
  $: ({ agency, bureausByAgency, recentlyApproved, user, existingSubscription } = data);
</script>

<div class="page-container">
  <Breadcrumbs>
    <BreadcrumbItem>
      <a href="/folders">Folders</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Folder: <a href="/folder/{agency.folder.folderId}">{agency.folder.folder}</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Agency: {agency.budgetAgencyTitle}
    </BreadcrumbItem>
  </Breadcrumbs>
</div>

<div class="page-container content-container">
  <h1>Agency: {agency.budgetAgencyTitle}</h1>

  <p>
    There are <strong>{formatNumber(agency.fileCount)} files</strong> associated with this agency.
  </p>

  <section class="page-section">
    <h2>Bureaus</h2>

    <ul>
      {#each bureausByAgency as bureau, bIndex}
        <li>
          <a href="/agency/{agency.budgetAgencyTitleId}/bureau/{bureau.budgetBureauTitleId}"
            >{bureau.budgetBureauTitle}</a
          >
          ({formatNumber(bureau.fileCount)}{bIndex === 0 ? ' files' : ''})
        </li>
      {/each}
    </ul>
  </section>

  <SubscribeLink
    {user}
    subType="agency"
    subItemId={agency.budgetAgencyTitleId}
    {existingSubscription}
  />

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
