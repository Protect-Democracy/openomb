<script lang="ts">
  import { formatFileTitle, formatDate, formatDateISO } from '$lib/formatters';
  import { uniqBy } from 'lodash-es';
  import type { filesSelect } from '$db/schema/files';
  import type { tafsSelect } from '$db/schema/tafs';

  // Types
  interface File extends filesSelect {
    tafs?: tafsSelect[];
  }

  // Props
  export let headerElement = 'h3';
  export let headerClasses = 'h3-alt';
  export let file: File;

  // Derived
  let hasTafs: boolean;
  $: hasTafs = file.tafs && file.tafs.length > 0 ? true : false;
  $: accounts = hasTafs ? file.tafs.map((t) => t.accountTitle) : [];
  $: agencies = hasTafs
    ? uniqBy(
        file.tafs.map((t) => ({ id: t.budgetAgencyTitleId, title: t.budgetAgencyTitle })),
        'id'
      )
    : [];
  hasTafs;
  $: bureaus = hasTafs
    ? uniqBy(
        file.tafs.map((t) => ({ id: t.budgetBureauTitleId, title: t.budgetBureauTitle })),
        'id'
      )
    : [];
  hasTafs;
</script>

<article class="file-listing-small">
  {#if hasTafs}
    <svelte:element this={headerElement} class="listing-heading {headerClasses}">
      <a href="/file/{file.fileId}"
        >{#if accounts.length === 1}
          {accounts[0]}
        {:else}
          {accounts[0]} and {accounts.length - 1} other account{accounts.length - 1 === 1
            ? ''
            : 's'}
        {/if}</a
      >
    </svelte:element>

    <div class="heirarchy">
      <a class="like-text" title="Folder" href="/folder/{file.folderId}">{file.folder}</a> /
      <a class="like-text" title="Agency" href="/agency/{agencies[0].title}">{agencies[0].title}</a
      >{agencies.length > 1 ? ` + ${agencies.length - 1}` : ''}
      /
      <a class="like-text" title="Bureau" href="/agency/{agencies[0].id}/bureau/{bureaus[0].id}"
        >{bureaus[0].title}</a
      >{bureaus.length > 1 ? ` + ${bureaus.length - 1}` : ''}
    </div>

    <div class="published-date">
      Approved <strong
        ><time datetime={formatDateISO(file.approvalTimestamp)}
          >{formatDate(file.approvalTimestamp, 'medium')}</time
        ></strong
      >
      for fiscal year <strong>{file.fiscalYear}</strong>.
    </div>

    <small class="file-id">File ID: {file.fileId}</small>
  {:else}
    <svelte:element this={headerElement} class="listing-heading {headerClasses}"
      ><a href="/file/{file.fileId}">{formatFileTitle(file)}</a></svelte:element
    >

    <div class="published-date">
      Approved <strong
        ><time datetime={formatDateISO(file.approvalTimestamp)}
          >{formatDate(file.approvalTimestamp, 'medium')}</time
        ></strong
      >
      for fiscal year <strong>{file.fiscalYear}</strong>.
    </div>

    <small class="file-id">File ID: {file.fileId}</small>
  {/if}
</article>

<style>
  .file-listing-small {
    margin-bottom: var(--spacing);
  }

  .listing-heading {
    padding-top: 0;
    margin-bottom: 0;
  }
</style>
