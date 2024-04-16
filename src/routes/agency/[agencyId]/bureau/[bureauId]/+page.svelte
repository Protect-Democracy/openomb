<script lang="ts">
  import type { PageData } from './$types';
  import { siteName } from '$config';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';

  export let data: PageData;
  $: ({ bureau, accountsByBureau } = data);
</script>

<svelte:head>
  <title>{bureau.budgetBureauTitle} Bureau ({bureau.agency.budgetAgencyTitle}) | {siteName}</title>
</svelte:head>

<Breadcrumbs>
  <BreadcrumbItem>
    <a href="/folder/{bureau.agency.folder.folderId}">{bureau.agency.folder.folder}</a>
  </BreadcrumbItem>
  <BreadcrumbItem>
    <a href="/agency/{bureau.agency.budgetAgencyTitleId}">{bureau.agency.budgetAgencyTitle}</a>
  </BreadcrumbItem>
  <BreadcrumbItem>
    {bureau.budgetBureauTitle}
  </BreadcrumbItem>
</Breadcrumbs>

<h1>{bureau.budgetBureauTitle} Bureau</h1>

<p>There are {bureau.fileCount} files associated with this bureau.</p>

<h2>Accounts</h2>

<ul>
  {#each accountsByBureau as account}
    <li>
      <a
        href="/agency/{bureau.agency
          .budgetAgencyTitleId}/bureau/{bureau.budgetBureauTitleId}/account/{account.accountTitleId}"
        >{account.accountTitle}</a
      >
      ({account.fileCount})
    </li>
  {/each}
</ul>
