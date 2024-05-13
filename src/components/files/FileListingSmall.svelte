<script lang="ts">
  import {
    formatFileTitle,
    formatDate,
    formatDateISO,
    highlight,
    formatTafsFormattedId
  } from '$lib/formatters';
  import { uniqBy } from 'lodash-es';
  import type { filesSelect } from '$db/schema/files';
  import type { tafsSelect } from '$db/schema/tafs';
  import type { SearchParams } from '$db/queries/search';

  // Types
  interface File extends filesSelect {
    tafs?: tafsSelect[];
  }

  // Props
  export let headerElement = 'h3';
  export let headerClasses = 'h3-alt';
  export let file: File;
  export let highlightParams: SearchParams;

  // Constants
  const tafsLimit = 3;

  // Derived
  let hasTafs: boolean;
  $: hasTafs = file.tafs && file.tafs.length > 0 ? true : false;
  $: agencies = hasTafs
    ? uniqBy(
        file?.tafs?.map((t) => ({ id: t.budgetAgencyTitleId, title: t.budgetAgencyTitle })),
        'id'
      )
    : [];
  $: bureaus = hasTafs
    ? uniqBy(
        file?.tafs?.map((t) => ({ id: t.budgetBureauTitleId, title: t.budgetBureauTitle })),
        'id'
      )
    : [];
  $: tafs = hasTafs
    ? uniqBy(
        file?.tafs?.map((t) => ({ id: t.tafsId, title: formatTafsFormattedId(t) })),
        'id'
      )
    : [];
</script>

<article class="file-listing-small">
  <svelte:element this={headerElement} class="listing-heading {headerClasses}">
    <small>File ID: {file.fileId}</small>
    <a href="/file/{file.fileId}">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html formatFileTitle(file, [highlightParams?.term, highlightParams?.account])}</a
    >
  </svelte:element>

  <ul class="inline-list heirarchy">
    {#if !hasTafs}
      <li>
        <a class="like-text" title="Go to folder: {file.folder}" href="/folder/{file.folderId}"
          >{file.folder}</a
        >
      </li>
    {:else}
      <li>
        <a
          class="like-text"
          title="Go to agency: {agencies[0].title}"
          href="/agency/{agencies[0].id}">{agencies[0].title}</a
        >{agencies.length > 1 ? ` + ${agencies.length - 1}` : ''}
      </li>

      <li>
        <a
          class="like-text"
          title="Go to bureau: {bureaus[0].title}"
          href="/agency/{agencies[0].id}/bureau/{bureaus[0].id}">{bureaus[0].title}</a
        >{bureaus.length > 1 ? ` + ${bureaus.length - 1}` : ''}
      </li>
    {/if}
  </ul>

  <div class="published-date">
    Approved <strong
      ><time datetime={formatDateISO(file.approvalTimestamp)}
        >{formatDate(file.approvalTimestamp, 'medium')}</time
      ></strong
    >
    for fiscal year
    <strong>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html highlight(
        file.fiscalYear?.toString(),
        highlightParams.years.map((y) => (y ? y.toString() : ''))
      )}</strong
    >.
  </div>

  {#if hasTafs}
    <div class="tafs">
      <acronym title="Treasury Appropriation Fund Symbol">TAFS</acronym>:
      {#each tafs as taf, ti (taf.id)}
        {#if ti < tafsLimit}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <span>{@html highlight(taf.title, [highlightParams.tafs])}</span
          >{#if ti < tafsLimit - 1 && tafs.length - 1 !== ti}<span>,&nbsp;</span>
          {/if}
        {/if}
      {/each}
    </div>
  {/if}
</article>

<style>
  .file-listing-small {
    margin-bottom: var(--spacing-double);
  }

  .listing-heading {
    padding-top: 0;
    margin-bottom: 0;
  }
</style>
