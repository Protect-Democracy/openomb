<script lang="ts">
  import type { PageData } from './$types';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';

  export let data: PageData;
  $: ({ agency, bureausByAgency } = data);
</script>

<div class="page-container">
  <Breadcrumbs>
    <BreadcrumbItem>
      Folder: <a href="/folder/{agency.folder.folderId}">{agency.folder.folder}</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Agency: {agency.budgetAgencyTitle}
    </BreadcrumbItem>
  </Breadcrumbs>

  <h1>{agency.budgetAgencyTitle}</h1>

  <p>There are {agency.fileCount} files associated with this agency.</p>

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
</div>
