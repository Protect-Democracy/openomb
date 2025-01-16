<script lang="ts">
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';
  import FileListingSmall from '$components/files/FileListingSmall.svelte';
  import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';

  export let data: PageData;
  $: ({ bureau, accountsByBureau, recentlyApproved, user, existingSubscription } = data);
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

  <p>There are {formatNumber(bureau.fileCount)} files associated with this bureau.</p>

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

  <SubscribeLink
    {user}
    subType="bureau"
    subItemId={`${bureau.agency.budgetAgencyTitleId},${bureau.budgetBureauTitleId}`}
    {existingSubscription}
  />

  <section class="page-section">
    <h2>Recently approved</h2>

    <div class="recently-approved-files">
      {#each recentlyApproved as file}
        <FileListingSmall {file} />
      {/each}
    </div>
  </section>
</div>
