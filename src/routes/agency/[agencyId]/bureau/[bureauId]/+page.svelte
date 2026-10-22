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
  $: ({ bureau, accountsByBureau, recentApportionments, user, existingSubscription } = data);
</script>

<div class="page-container">
  <Breadcrumbs>
    <BreadcrumbItem>
      <a href={resolve('/folders')}>Folders</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Folder:
      {#if bureau.agency.folder.folderId}
        <a href={resolve('/folder/[folderId]', { folderId: bureau.agency.folder.folderId })}
          >{bureau.agency.folder.folder}</a
        >
      {:else}
        {bureau.agency.folder.folder}
      {/if}
    </BreadcrumbItem>
    <BreadcrumbItem>
      Agency: <a
        href={resolve('/agency/[agencyId]', { agencyId: bureau.agency.budgetAgencyTitleId })}
        >{bureau.agency.budgetAgencyTitle}</a
      >
    </BreadcrumbItem>
    <BreadcrumbItem>
      Bureau: {bureau.budgetBureauTitle}
    </BreadcrumbItem>
  </Breadcrumbs>
</div>

<div class="page-container content-container">
  <h1>Bureau: {bureau.budgetBureauTitle}</h1>

  <p>
    There are <strong>{formatNumber(bureau.fileCount)} files</strong> associated with this bureau.
  </p>

  <SubscribeLink
    {user}
    subType="bureau"
    subItemId={`${bureau.agency.budgetAgencyTitleId},${bureau.budgetBureauTitleId}`}
    subItemFormatted={bureau.budgetBureauTitle || undefined}
    {existingSubscription}
  />

  <section class="page-section">
    <h2>Accounts</h2>

    <ul>
      {/* Unfortunately there are some duplicate account titles within bureaus, so we have to use the index as a key here instead of accountTitleId */ null}
      {#each accountsByBureau as account, aIndex (aIndex)}
        <li>
          {#if bureau.budgetBureauTitleId && account.accountTitleId}
            <a
              href={resolve('/agency/[agencyId]/bureau/[bureauId]/account/[accountId]', {
                agencyId: bureau.agency.budgetAgencyTitleId,
                bureauId: bureau.budgetBureauTitleId,
                accountId: account.accountTitleId
              })}>{account.accountTitle}</a
            >
          {:else}
            {account.accountTitle}
          {/if}
          ({formatNumber(account.fileCount)}{aIndex === 0 ? ' files' : ''})
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
