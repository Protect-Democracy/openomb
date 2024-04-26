<script lang="ts">
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';
  import FileListingSmall from '$components/files/FileListingSmall.svelte';

  export let data: PageData;
  $: ({ agency, bureausByAgency, recentlyApproved } = data);
</script>

<div class="page-container">
  <Breadcrumbs>
    <BreadcrumbItem>
      <a href="/folders">Folders</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Folder: <a href="/folder/{agency.folder.folderId}">{agency.folder.folder}</a>
    </BreadcrumbItem>
    <BreadcrumbItem>
      Agency: {agency.budgetAgencyTitle}
    </BreadcrumbItem>
  </Breadcrumbs>
</div>

<div class="page-container content-container">
  <h1>Agency: {agency.budgetAgencyTitle}</h1>

  <p>
    There are <strong>{formatNumber(agency.fileCount)} files</strong> associated with this agency.
  </p>

  <section class="page-section">
    <h2>Bureaus</h2>

    <ul>
      {#each bureausByAgency as bureau, bIndex}
        <li>
          <a href="/agency/{agency.budgetAgencyTitleId}/bureau/{bureau.budgetBureauTitleId}"
            >{bureau.budgetBureauTitle}</a
          >
          ({formatNumber(bureau.fileCount)}{bIndex === 0 ? ' files' : ''})
        </li>
      {/each}
    </ul>
  </section>

  <section class="page-section">
    <h2>Recently approved</h2>

    <div class="recently-approved-files">
      {#each recentlyApproved as file}
        <FileListingSmall {file} />
      {/each}
    </div>
  </section>
</div>
