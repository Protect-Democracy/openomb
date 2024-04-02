<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  $: ({ agency, bureausByAgency } = data);
</script>

<p>Folder: <a href="/folder/{agency.folder.folderId}">{agency.folder.folder}</a></p>

<h1>Agency: {agency.budgetAgencyTitle}</h1>

<p>There are {agency.fileCount} files in this folder.</p>

<h2>Bureaus</h2>

<ul>
  {#each bureausByAgency as bureau}
    <li>
      <a href="/agency/{agency.budgetAgencyTitleId}/bureau/{bureau.budgetBureauTitleId}"
        >{bureau.budgetBureauTitle}</a
      >
      ({bureau.fileCount})
    </li>
  {/each}
</ul>
