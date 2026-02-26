<script lang="ts">
  import type { PageData } from './$types';
import { formatNumber } from '$lib/formatters';
import FileListingHighlightable from '$components/files/FileListingHighlightable.svelte';
import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';
import { Tab, Tabs } from '$components/tabs';
import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';
import ApprovalsByYear from '$components/charts/ApprovalsByYear.svelte';

export let data: PageData;
$: ({
  folder,
  agenciesByFolder,
  filesWithoutTafs,
  recentlyApproved,
  recentSpendPlans,
  user,
  existingSubscription
} = data);
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

  <p>
    There are <strong>{formatNumber(folder.fileCount)} files</strong
    >{#if folder.spendPlanCount > 0}{' '}and
      <strong>{formatNumber(folder.spendPlanCount)} spend plans</strong>{/if} in this folder.
  </p>

  <SubscribeLink
    {user}
    subType="folder"
    subItemId={folder.folderId}
    subItemFormatted={folder.folder}
    {existingSubscription}
  />

  <section class="page-section">
    <h2>Agencies</h2>

    {#if agenciesByFolder && agenciesByFolder.length}
      <ul>
        {#each agenciesByFolder as agency, aIndex}
          <li>
            <a href="/agency/{agency.budgetAgencyTitleId}">{agency.budgetAgencyTitle}</a>
            ({formatNumber(agency.fileCount)}{aIndex === 0 ? ' files' : ''})
            {#if agency.spendPlanCount > 0}({formatNumber(agency.spendPlanCount)} spend plans){/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p>We were unable to find any agencies in this folder.</p>
    {/if}
  </section>

  {#await data.fileCountByMonthByYear then fileCountByMonthByYearData}
    <section class="page-section">
      <h2>Files approved by month</h2>

      <div class="chart-container">
        <ApprovalsByYear data={fileCountByMonthByYearData} align="left" height="20rem" />
      </div>
    </section>
  {/await}

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
