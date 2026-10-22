<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';
  import TabbedFileListing from '$components/files/TabbedFileListing.svelte';
  import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';
  import ApprovalsByYear from '$components/charts/ApprovalsByYear.svelte';

  export let data: PageData;
  $: ({ agency, bureausByAgency, recentApportionments, user, existingSubscription } = data);
</script>

<div class="page-container">
  <Breadcrumbs>
    <BreadcrumbItem>
      <a href={resolve('/folders')}>Folders</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Folder:
      {#if agency.folder.folderId}
        <a href={resolve('/folder/[folderId]', { folderId: agency.folder.folderId })}
          >{agency.folder.folder}</a
        >
      {:else}
        {agency.folder.folder}
      {/if}
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

  <SubscribeLink
    {user}
    subType="agency"
    subItemId={agency.budgetAgencyTitleId}
    subItemFormatted={agency.budgetAgencyTitle || undefined}
    {existingSubscription}
  />

  <section class="page-section">
    <h2>Bureaus</h2>

    <ul>
      {#each bureausByAgency as bureau, bIndex (bureau.budgetBureauTitleId)}
        <li>
          {#if bureau.budgetBureauTitleId}
            <a
              href={resolve('/agency/[agencyId]/bureau/[bureauId]', {
                agencyId: agency.budgetAgencyTitleId,
                bureauId: bureau.budgetBureauTitleId
              })}>{bureau.budgetBureauTitle}</a
            >
          {:else}
            {bureau.budgetBureauTitle}
          {/if}
          ({formatNumber(bureau.fileCount)}{bIndex === 0 ? ' files' : ''})
        </li>
      {/each}
    </ul>
  </section>

  {#await data.fileCountByMonthByYear then fileCountByMonthByYearData}
    {#if fileCountByMonthByYearData && fileCountByMonthByYearData.length > 0}
      <section class="page-section">
        <h2>Files approved by month</h2>

        <div class="chart-container">
          <ApprovalsByYear data={fileCountByMonthByYearData} align="left" height="20rem" />
        </div>
      </section>
    {/if}
  {/await}

  <section class="page-section">
    <h2>Recent Apportionments</h2>

    <TabbedFileListing files={recentApportionments} />
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

  .chart-container {
    width: 100%;
    margin-bottom: var(--spacing-double);
  }
</style>
