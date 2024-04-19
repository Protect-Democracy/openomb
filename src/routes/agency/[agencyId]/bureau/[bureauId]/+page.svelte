<script lang="ts">
  import type { PageData } from './$types';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';

  export let data: PageData;
  $: ({ bureau, accountsByBureau } = data);
</script>

<div class="page-container">
  <Breadcrumbs>
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

  <h1>Bureau: {bureau.budgetBureauTitle}</h1>

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
</div>
