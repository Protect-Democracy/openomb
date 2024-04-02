<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  $: ({ account, tafsByAccount } = data);
</script>

<p>
  Folder: <a href="/folder/{account.bureau.agency.folder.folderId}"
    >{account.bureau.agency.folder.folder}</a
  ><br />
  Agency:
  <a href="/agency/{account.bureau.agency.budgetAgencyTitleId}"
    >{account.bureau.agency.budgetAgencyTitle}</a
  ><br />
  Bureau:
  <a
    href="/agency/{account.bureau.agency.budgetAgencyTitleId}/bureau/{account.bureau
      .budgetBureauTitleId}">{account.bureau.budgetBureauTitle}</a
  >
</p>

<h1>Bureau: {account.accountTitle}</h1>

<p>There are {account.fileCount} files in this account.</p>

<h2>TAFS</h2>

<ul>
  {#each tafsByAccount as tafs}
    <li>
      TAFS: {tafs.tafsId}
      <ul>
        {#each tafs.years as year}
          <li>
            FY{year.fiscalYear} -
            {#each year.iterations as iteration}
              <a href="/file/{iteration.fileId}#tafs_{iteration.tafsTableId}"
                >{iteration.iteration}</a
              >,
            {/each}
          </li>
        {/each}
      </ul>
    </li>
  {/each}
</ul>
