<script lang="ts">
  import type { PageData } from './$types';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';
  import TafsDisplay from '$components/blocks/TafsDisplay.svelte';

  export let data: PageData;
  $: ({ account, tafsByAccount } = data);
</script>

<div class="page-container">
  <Breadcrumbs>
    <BreadcrumbItem>
      Folder: <a href="/folder/{account.bureau.agency.folder.folderId}"
        >{account.bureau.agency.folder.folder}</a
      >
    </BreadcrumbItem>
    <BreadcrumbItem>
      Agency: <a href="/agency/{account.bureau.agency.budgetAgencyTitleId}"
        >{account.bureau.agency.budgetAgencyTitle}</a
      >
    </BreadcrumbItem>
    <BreadcrumbItem>
      Bureau: <a
        href="/agency/{account.bureau.agency.budgetAgencyTitleId}/bureau/{account.bureau
          .budgetBureauTitleId}"
      >
        {account.bureau.budgetBureauTitle}
      </a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Account: {account.accountTitle}
    </BreadcrumbItem>
  </Breadcrumbs>

  <h1>{account.accountTitle} Account</h1>

  <p>There are {account.fileCount} files in this account.</p>

  <TafsDisplay groupByAccount hideAccountName tafs={tafsByAccount} />
</div>
