<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';
  import TafsDisplay from '$components/tafs/TafsDisplay.svelte';
  import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';
  import { formatNumber } from '$lib/formatters';

  export let data: PageData;
  $: ({ account, tafsByAccount, user, existingSubscription } = data);
</script>

<div class="page-container">
  <Breadcrumbs>
    <BreadcrumbItem>
      Folder:
      {#if account.bureau.agency.folder.folderId}
        <a href={resolve('/folder/[folderId]', { folderId: account.bureau.agency.folder.folderId })}
          >{account.bureau.agency.folder.folder}</a
        >
      {:else}
        {account.bureau.agency.folder.folder}
      {/if}
    </BreadcrumbItem>
    <BreadcrumbItem>
      Agency: <a
        href={resolve('/agency/[agencyId]', {
          agencyId: account.bureau.agency.budgetAgencyTitleId
        })}>{account.bureau.agency.budgetAgencyTitle}</a
      >
    </BreadcrumbItem>
    <BreadcrumbItem>
      Bureau:
      {#if account.bureau.budgetBureauTitleId}
        <a
          href={resolve('/agency/[agencyId]/bureau/[bureauId]', {
            agencyId: account.bureau.agency.budgetAgencyTitleId,
            bureauId: account.bureau.budgetBureauTitleId
          })}
        >
          {account.bureau.budgetBureauTitle}
        </a>
      {:else}
        {account.bureau.budgetBureauTitle}
      {/if}
    </BreadcrumbItem>
    <BreadcrumbItem>
      Account: {account.accountTitle}
    </BreadcrumbItem>
  </Breadcrumbs>

  <h1>{account.accountTitle} Account</h1>

  <p>There are <strong>{formatNumber(account.fileCount)} files</strong> in this account.</p>

  <SubscribeLink
    {user}
    subType="account"
    subItemId={`${account.bureau.agency.budgetAgencyTitleId},${account.bureau.budgetBureauTitleId},${account.accountTitleId}`}
    subItemFormatted={account.accountTitle || undefined}
    {existingSubscription}
  />

  <TafsDisplay groupByAccount hideAccountHeader tafs={tafsByAccount} />
</div>
