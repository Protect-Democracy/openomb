<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  $: ({ folder, agenciesByFolder } = data);
</script>

<h1>Folder: {folder.folder}</h1>

<p>There are {folder.fileCount} files in this folder.</p>

<h2>Agencies</h2>

<ul>
  {#each agenciesByFolder as agency}
    <li>
      <a href="/agency/{agency.budgetAgencyTitleId}">{agency.budgetAgencyTitle}</a>
      ({agency.fileCount})
    </li>
  {/each}
</ul>
