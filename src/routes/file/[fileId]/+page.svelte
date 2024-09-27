<script lang="ts">
  import { uniqBy, reduce } from 'lodash-es';
  import type { PageData } from './$types';
  import { formatFileTitle, formatTafsFormattedId, formatDate } from '$lib/formatters';
  import ScrollToTop from '$components/navigation/ScrollToTop.svelte';
  import TAFSLines from './TAFSLines.svelte';

  // Props
  export let data: PageData;

  // Derived
  $: ({ file, prevIterationFiles } = data);
  $: prevIterationFootnotes = uniqBy(
    reduce(
      Object.values(prevIterationFiles),
      (accum, iterFile) => {
        return [...accum, ...(iterFile.footnotes || [])];
      },
      []
    ),
    ['footnoteNumber', 'footnoteText']
  );
  $: ({ tafs, footnotes } = file);
  $: uniqueAgencies = uniqBy(
    tafs.map((tafsGroup) => ({
      id: tafsGroup.budgetAgencyTitleId,
      title: tafsGroup.budgetAgencyTitle
    })),
    'id'
  );
</script>

<article class="page-container content-container">
  <h1 class="h2">
    <span>{formatFileTitle(file)}</span>
  </h1>

  <div class="file-metadata">
    <ul class="grid-values">
      <li class="grid-value">
        <strong>File ID<span class="sr-only">:</span></strong>
        <span>{file.fileId}</span>
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
        <strong>Funds provided by<span class="sr-only">:</span></strong>
        <span>
          {file.fundsProvidedByParsed}
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

  <section>
    <h2 class="sr-only">Schedules</h2>

    {#if tafs?.length}
      {#each tafs as tafsGroup}
        {@const prevIterationTafs = prevIterationFiles[tafsGroup.tafsTableId]?.tafs?.find(
          (taf) => taf.tafsId === tafsGroup.tafsId
        )}

        <section class="tafs-section">
          <h3 id="tafs_{tafsGroup.tafsTableId}" class="tafs-heading">
            <acronym title="Treasury Appropriation Fund Symbol">TAFS</acronym>: {formatTafsFormattedId(
              tafsGroup
            )} - {tafsGroup.accountTitle}
          </h3>

          <div class="tafs-data grid-values">
            <div class="iterations grid-value">
              <strong id="tafs_{tafsGroup.tafsTableId}_iterations_label"
                >Iterations<span class="sr-only">:</span></strong
              >

              <ul aria-labelledby="tafs_{tafsGroup.tafsTableId}_iterations_label">
                {#each tafsGroup.iterations as iteration}
                  <li>
                    {#if iteration.iteration === tafsGroup.iteration}
                      <span
                        >{iteration.iteration}: {formatDate(iteration.approvalTimestamp, 'short')}
                        (this iteration)</span
                      >
                    {:else}
                      <a
                        href="/file/{iteration.fileId}#tafs_{iteration.tafsTableId}"
                        title="Go to file wih this iteration"
                      >
                        {iteration.iteration}: {formatDate(iteration.approvalTimestamp, 'short')}</a
                      >
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>

            <div class="grid-value">
              <strong>Adjustment authority<span class="sr-only">:</span></strong>
              <span>{tafsGroup.adjAut ? 'Yes' : 'No'}</span>
            </div>

            <div class="grid-value">
              <strong>Reporting categories<span class="sr-only">:</span></strong>
              <span>{tafsGroup.rptCat ? 'Yes' : 'No'}</span>
            </div>

            <div class="grid-value">
              <strong>Bureau<span class="sr-only">:</span></strong>
              <span>
                <a
                  href="/agency/{tafsGroup.budgetAgencyTitleId}/bureau/{tafsGroup.budgetBureauTitleId}"
                  title="Go to bureau">{tafsGroup.budgetBureauTitle}</a
                >
              </span>
            </div>

            <div class="grid-value">
              <strong>Account<span class="sr-only">:</span></strong>
              <span>
                <a
                  href="/agency/{tafsGroup.budgetAgencyTitleId}/bureau/{tafsGroup.budgetBureauTitleId}/account/{tafsGroup.accountTitleId}"
                  title="Go to bureau">{tafsGroup.accountTitle}</a
                >
              </span>
            </div>
          </div>

          <TAFSLines currentTafs={tafsGroup} {prevIterationTafs} />
        </section>
      {/each}
    {:else}
      <p><em>No schedule information available.</em></p>
    {/if}
  </section>

  <section class="page-section">
    <h2>Footnotes</h2>

    <p>
      Footnotes provide further information about, or establish further legal requirements related
      to the use of, the funds in a given line or set of lines in an apportionment. If footnotes
      appear on lines <em>1920</em> or <em>6190</em>, they apply to all the lines in the
      <em>1xxx</em>
      and <em>6xxx</em> sections, respectively. The following are all the footnotes associated with this
      file.
    </p>

    {#if footnotes.length}
      <table class="font-small">
        <thead>
          <tr><th>Number</th><th>Text</th></tr>
        </thead>

        <tbody>
          {#each footnotes as footnote}
            <tr>
              <td id="footnote__{footnote.footnoteNumber}">{footnote.footnoteNumber}</td>
              <td><div class="text-container">{footnote.footnoteText}</div></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p><em>No footnotes available.</em></p>
    {/if}

    {#if prevIterationFiles && Object.keys(prevIterationFiles).length > 0}
      <p class="previous-iteration-footnotes-desc">
        The following are all of the footnotes associated with the previous iteration of this file.
      </p>
      {#if prevIterationFootnotes.length}
        <table class="font-small previous-iteration-footnotes-table">
          <thead>
            <tr><th>Number</th><th>Text</th></tr>
          </thead>

          <tbody>
            {#each prevIterationFootnotes as footnote}
              <tr>
                <td id="footnote__{footnote.footnoteNumber}">{footnote.footnoteNumber}</td>
                <td><div class="text-container">{footnote.footnoteText}</div></td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p><em>No footnotes available.</em></p>
      {/if}
    {/if}
  </section>

  <ScrollToTop />
</article>

<style>
  .file-metadata {
    display: flex;
    column-gap: var(--spacing-large);
    justify-content: space-between;
    padding-top: var(--spacing-double);
    margin-bottom: var(--spacing-large);

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

  .tafs-section {
    margin-bottom: var(--spacing-large);
  }

  .tafs-data {
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    margin-bottom: 0;
    /* TODO: We want these to line up with the file grid values in size */
    margin-right: calc(var(--spacing) * 8);

    @media (max-width: 1000px) {
      & {
        margin-right: 0;
      }
    }

    @media (max-width: 600px) {
      & {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
  }

  .tafs-data .grid-value {
    border-color: var(--color-gray-light);
    border-width: var(--border-weight-thin);
    font-size: var(--font-size-small);
    line-height: var(--line-height);
  }

  .iterations ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .previous-iteration-footnotes-desc {
    margin-top: var(--spacing-triple);
  }
</style>
