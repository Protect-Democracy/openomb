<script lang="ts">
  import type { PageData } from './$types';
  import { siteName } from '$config';
  import Breadcrumbs from '$components/navigation/Breadcrumbs.svelte';
  import BreadcrumbItem from '$components/navigation/BreadcrumbItem.svelte';

  export let data: PageData;
  $: ({ agency, bureausByAgency } = data);
</script>

<svelte:head>
  <title>{agency.budgetAgencyTitle} | {siteName}</title>
</svelte:head>

<Breadcrumbs>
  <BreadcrumbItem>
    <a href="/folder/{agency.folder.folderId}">{agency.folder.folder}</a>
  </BreadcrumbItem>
  <BreadcrumbItem>
    {agency.budgetAgencyTitle}
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
