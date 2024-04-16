<script lang="ts">
  import type { PageData } from './$types';
  import { siteName } from '$config';

  export let data: PageData;
  $: ({ folder, agenciesByFolder } = data);
</script>

<svelte:head>
  <title>{folder.folder} Folder | {siteName}</title>
</svelte:head>


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
