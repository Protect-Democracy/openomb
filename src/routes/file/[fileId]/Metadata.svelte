<script lang="ts">
  import { uniqBy, isString } from 'lodash-es';
  import { formatDate, deconstructLaws } from '$lib/formatters';
  import ExternalLink from '$components/links/ExternalLink.svelte';

  // Props
  export let file;

  // Derived
  $: ({ tafs } = file);
  $: letterApportionment = !!file.pdfUrl;
  $: uniqueAgencies = uniqBy(
    tafs.map((tafsGroup) => ({
      id: tafsGroup.budgetAgencyTitleId,
      title: tafsGroup.budgetAgencyTitle
    })),
    'id'
  );
  $: fundsParts = deconstructLaws(file.fundsProvidedByParsed);
</script>

<div class="file-metadata">
  <ul class="grid-values">
    <li class="grid-value">
      <strong>File ID<span class="sr-only">:</span></strong>
      <span class="file-id-value"
        >{file.fileId}{#if letterApportionment}<a href="#page-footnote-file-id">&Dagger;</a
          >{/if}</span
      >
    </li>

    <li class="grid-value">
      <strong>File approved<span class="sr-only">:</span></strong>
      <span>{formatDate(file.approvalTimestamp, 'medium')}</span>
    </li>

    <li class="grid-value">
      <strong>Fiscal year<span class="sr-only">:</span></strong>
      <span>{file.fiscalYear}</span>
    </li>

    <li class="grid-value">
      <strong>Approved by<span class="sr-only">:</span></strong>
      <span>
        <a href="/approver/{file.approverTitleId}">{file.approverTitle}</a>
      </span>
    </li>

    <li class="grid-value">
      <strong>Folder<span class="sr-only">:</span></strong>
      <span>
        <a href="/folder/{file.folderId}">{file.folder}</a>
      </span>
    </li>

    <li class="grid-value">
      <strong
        >{uniqueAgencies.length > 1 ? 'Agencies' : 'Agency'}<span class="sr-only">:</span></strong
      >
      <span>
        {#each uniqueAgencies as agency, li (agency.id)}
          <a href="/agency/{agency.id}">{agency.title}</a>{li > 0 && li < uniqueAgencies.length
            ? ', '
            : ''}
        {/each}
      </span>
    </li>

    <li class="grid-value grid-span-2">
      <strong
        >Funds provided by <a href="#page-footnote-funds">&dagger;</a><span class="sr-only">:</span
        ></strong
      >
      <span>
        {#each fundsParts as part}
          {#if isString(part)}
            {part}{' '}
          {:else}
            {part.pre || ''}<ExternalLink url={part.url}>{part.text}</ExternalLink>{part.post ||
              ''}{' '}
          {/if}
        {/each}
      </span>
    </li>
  </ul>

  <div class="sources">
    <span class="sr-only">Sources:</span>

    <ul>
      {#if file.pdfUrl}
        <li>
          <a class="button" href={file.pdfUrl} target="_blank" rel="noopener noreferrer"
            >Download primary source as PDF <br /> <small>apportionment-public.max.gov</small></a
          >
        </li>
      {/if}
      {#if file.excelUrl}
        <li>
          <a class="button" href={file.excelUrl} target="_blank" rel="noopener noreferrer"
            >Download primary source as Excel <br />
            <small>apportionment-public.max.gov</small></a
          >
        </li>
      {/if}
      {#if file.sourceUrl && !file.pdfUrl}
        <li>
          <a class="button" href={file.sourceUrl} target="_blank" rel="noopener noreferrer"
            >Download primary source as JSON <br /> <small>apportionment-public.max.gov</small></a
          >
        </li>
      {/if}
    </ul>
  </div>
</div>

<style>
  .file-metadata {
    display: flex;
    column-gap: var(--spacing-large);
    justify-content: space-between;
    padding-top: var(--spacing-double);
    margin-bottom: var(--spacing-double);

    @media (max-width: 768px) {
      & {
        display: block;
      }
    }
  }

  .grid-values {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    column-gap: var(--spacing-double);
    row-gap: var(--spacing);
    margin: 0;
    padding: 0;
    list-style: none;

    @media (max-width: 1000px) {
      & {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }

    @media (max-width: 300px) {
      & {
        grid-template-columns: 1fr 1fr;
      }
    }
  }

  .grid-value {
    margin: 0;
    padding: var(--spacing-half) 0 var(--spacing) 0;
    border-top: var(--border-weight) solid var(--color-gray-dark);

    strong {
      display: block;
      font-size: var(--font-size-small);
    }
  }

  .grid-span-2 {
    grid-column: span 2;
  }

  .sources {
    width: auto;
    flex-shrink: 0;

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      margin-bottom: var(--spacing-half);
      padding: 0;
    }

    @media (max-width: 768px) {
      & {
        padding-top: var(--spacing-double);
      }

      a.button {
        padding: var(--spacing-half) var(--spacing-double);
        min-width: auto;
      }
    }
  }

  .file-id-value {
    word-break: break-all;
  }
</style>
