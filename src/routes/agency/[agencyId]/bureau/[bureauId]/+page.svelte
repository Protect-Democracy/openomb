<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  $: ({ bureau, accountsByBureau } = data);
</script>

<p>
  Folder: <a href="/folder/{bureau.agency.folder.folderId}">{bureau.agency.folder.folder}</a><br />
  Agency:
  <a href="/agency/{bureau.agency.budgetAgencyTitleId}">{bureau.agency.budgetAgencyTitle}</a>
</p>

<h1>Bureau: {bureau.budgetBureauTitle}</h1>

<p>There are {bureau.fileCount} files in this folder.</p>

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
