<script lang="ts">
  import type { PageData } from './$types';
import { formatNumber } from '$lib/formatters';
import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';
import FileListingHighlightable from '$components/files/FileListingHighlightable.svelte';
import { Tab, Tabs } from '$components/tabs';
import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';
import ApprovalsByYear from '$components/charts/ApprovalsByYear.svelte';

export let data: PageData;
$: ({ bureau, accountsByBureau, recentlyApproved, recentSpendPlans, user, existingSubscription } =
  data);
</script>

<div class="page-container">
  <Breadcrumbs>
    <BreadcrumbItem>
      <a href="/folders">Folders</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Folder: <a href="/folder/{bureau.agency.folder.folderId}">{bureau.agency.folder.folder}</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Agency: <a href="/agency/{bureau.agency.budgetAgencyTitleId}"
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
    There are <strong>{formatNumber(bureau.fileCount)} files</strong
    >{#if bureau.spendPlanCount > 0}{' '}and
      <strong>{formatNumber(bureau.spendPlanCount)} spend plans</strong>{/if} associated with this bureau.
  </p>

  <SubscribeLink
    {user}
    subType="bureau"
    subItemId={`${bureau.agency.budgetAgencyTitleId},${bureau.budgetBureauTitleId}`}
    subItemFormatted={bureau.budgetBureauTitle}
    {existingSubscription}
  />

  <section class="page-section">
    <h2>Accounts</h2>

    <ul>
      {#each accountsByBureau as account, aIndex}
        <li>
          <a
            href="/agency/{bureau.agency
              .budgetAgencyTitleId}/bureau/{bureau.budgetBureauTitleId}/account/{account.accountTitleId}"
            >{account.accountTitle}</a
          >
          ({formatNumber(account.fileCount)}{aIndex === 0 ? ' files' : ''})
        </li>
      {/each}
    </ul>
  </section>

  {#await data.fileCountByMonthByYear then fileCountByMonthByYearData}
    <section class="page-section">
      <h2>Files approved by month</h2>

      <div class="chart-container">
        <ApprovalsByYear data={fileCountByMonthByYearData} align="left" height="20rem" />
      </div>
    </section>
  {/await}

  <section class="page-section">
    {#if recentSpendPlans && recentSpendPlans.length > 0}
      {#if recentlyApproved && recentlyApproved.length > 0}
        <Tabs defaultTabId="recent-files">
          <Tab label="Recently approved" id="recent-files">
            <div class="recently-approved-files">
              {#each recentlyApproved as file}
                <FileListingHighlightable {file} />
              {/each}
            </div>
          </Tab>
          <Tab label="Recent Spend Plans" id="recent-spend-plans">
            {#each recentSpendPlans as spendPlan}
              <FileListingHighlightable file={spendPlan} />
            {/each}
          </Tab>
        </Tabs>
      {:else}
        <h2>Recent Spend Plans</h2>

        {#each recentSpendPlans as spendPlan}
          <FileListingHighlightable file={spendPlan} />
        {/each}
      {/if}
    {:else}
      <h2>Recently approved</h2>

      <div class="recently-approved-files">
        {#each recentlyApproved as file}
          <FileListingHighlightable {file} />
        {/each}
      </div>
    {/if}
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
