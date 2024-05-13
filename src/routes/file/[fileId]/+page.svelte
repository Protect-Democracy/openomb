<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { PageData } from './$types';
  import { prefersReducedMotion } from '$lib/utilities';
  import {
    formatCurrency,
    formatFileTitle,
    formatTafsFormattedId,
    formatDate
  } from '$lib/formatters';
  import ScrollToTop from '$components/navigation/ScrollToTop.svelte';

  // Props
  export let data: PageData;

  // Constants
  const transitionTime = 300;

  // Derived
  $: ({ file } = data);
  $: ({ tafs, footnotes } = file);

  // Keep track of if footnote is expanded.  Default to false
  let footnotesExpanded: Record<string, boolean> = {};
  $: tafs.forEach((tafsGroup) => {
    tafsGroup.lines.forEach((line) => {
      const id = `${tafsGroup.tafsTableId}-${line.lineIndex}`;
      footnotesExpanded[id] =
        footnotesExpanded[id] === undefined
          ? false
          : footnotesExpanded[id] === false
            ? false
            : true;
    });
  });

  // Methods
  function toggleFootnote(id: string, event: Event): void {
    event?.preventDefault();
    footnotesExpanded = {
      ...footnotesExpanded,
      [id]: !footnotesExpanded[id]
    };
    return;
  }

  function isTotalRow(line: object): boolean {
    return line.lineNumber.match(/^(1920|6190)$/);
  }
</script>

<article class="page-container content-container">
  <h1>
    <small>File ID: {file.fileId}</small>
    <span>{formatFileTitle(file)}</span>
  </h1>

  <p>
    File approved on <strong>{formatDate(file.approvalTimestamp, 'medium')}</strong> by
    <a href="/approver/{file.approverTitleId}" class="like-text"
      ><strong>{file.approverTitle}</strong></a
    >
    for fiscal year <strong>{file.fiscalYear}</strong>.
    {#if file.fundsProvidedByParsed}
      Funds provided by
      <strong>{file.fundsProvidedByParsed}</strong>.
    {/if}
    Filed under folder
    <a href="/folder/{file.folderId}">{file.folder}</a>.
  </p>

  <p class="font-small">
    Sources:
    {#if file.pdfUrl}
      <a href={file.pdfUrl} target="_blank" rel="noopener noreferrer">PDF</a>
    {/if}
    {#if file.excelUrl}
      <a href={file.excelUrl} target="_blank" rel="noopener noreferrer">Excel</a>,
    {/if}
    {#if file.sourceUrl && !file.pdfUrl}
      <a href={file.sourceUrl} target="_blank" rel="noopener noreferrer">JSON</a>
    {/if}
  </p>

  <section>
    <h2>Schedules</h2>

    {#if tafs?.length}
      {#each tafs as tafsGroup}
        <section class="page-section">
          <h3 id="tafs_{tafsGroup.tafsTableId}" class="tafs-heading">
            <acronym title="Treasury Appropriation Fund Symbol">TAFS</acronym>: {formatTafsFormattedId(
              tafsGroup
            )} - {tafsGroup.accountTitle}
          </h3>

          <ul class="inline-list">
            <li>
              <a
                href="/agency/{tafsGroup.budgetAgencyTitleId}"
                class="like-text"
                title="Go to agency">{tafsGroup.budgetAgencyTitle}</a
              >
            </li>
            <li>
              <a
                href="/agency/{tafsGroup.budgetAgencyTitleId}/bureau/{tafsGroup.budgetBureauTitleId}"
                class="like-text"
                title="Go to bureau">{tafsGroup.budgetBureauTitle}</a
              >
            </li>
          </ul>

          <div class="tafs-data">
            {#if tafsGroup.iterations.length > 1}
              <div class="iterations">
                <strong id="tafs_{tafsGroup.tafsTableId}_iterations_label">Iterations</strong>
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
                          {iteration.iteration}: {formatDate(
                            iteration.approvalTimestamp,
                            'short'
                          )}</a
                        >
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
            <div>
              <p>
                Adjustment authority: <strong>{tafsGroup.adjAut ? 'Yes' : 'No'}</strong><br />
                Reporting categories: <strong>{tafsGroup.rptCat ? 'Yes' : 'No'}</strong>
              </p>
            </div>
          </div>

          <table class="font-small">
            <thead>
              <tr>
                <th>Line #</th>
                <th>Split</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Footnotes</th>
              </tr>
            </thead>

            <tbody>
              {#each tafsGroup.lines as line}
                <tr class:total={isTotalRow(line)}>
                  <td>{line.lineNumber}</td>
                  <td>{line.lineSplit}</td>
                  <td>{line.lineDescription}</td>
                  <td
                    >{#if line.approvedAmount}{formatCurrency(line.approvedAmount)}{/if}</td
                  >
                  <td>
                    {#if line.footnotes && line.footnotes.length > 0}
                      <span class="no-js-only-inline"><small>See footnotes below</small></span>
                      <span class="has-js-only-inline">
                        <button
                          class="compact small"
                          aria-expanded={footnotesExpanded[
                            `${tafsGroup.tafsTableId}-${line.lineIndex}`
                          ]
                            ? true
                            : false}
                          aria-controls="inline-footnotes-{tafsGroup.tafsTableId}-{line.lineIndex}"
                          on:click={(e) =>
                            toggleFootnote(`${tafsGroup.tafsTableId}-${line.lineIndex}`, e)}
                          >Footnotes</button
                        >
                      </span>
                    {/if}
                  </td>
                </tr>

                {#if line.footnotes && line.footnotes.length > 0}
                  <tr
                    class="footnote-row no-js-only-table-row"
                    id="inline-footnotes-{tafsGroup.tafsTableId}-{line.lineIndex}"
                  >
                    <th colspan="2" scope="row">
                      Footnotes for line {line.lineNumber}{line.lineSplit
                        ? ` (${line.lineSplit})`
                        : ''}:</th
                    >
                    <td colspan="3">
                      {#each line.footnotes as footnote}
                        <p>
                          <strong>{footnote.footnoteNumber}</strong>: {footnote.footnoteText}
                        </p>
                      {/each}
                    </td>
                  </tr>
                {/if}

                {#if line.footnotes && line.footnotes.length > 0 && footnotesExpanded[`${tafsGroup.tafsTableId}-${line.lineIndex}`]}
                  <!-- TODO: TRs don't care about height and so slide() transition does not work on them.  Tried creating a custom transition that managed max-height, but that did not work.  Adding transition to inner elements here works, but its a bit jumpy with the tr thing.  -->
                  <tr
                    class="footnote-row has-js-only-table-row"
                    id="inline-footnotes-{tafsGroup.tafsTableId}-{line.lineIndex}"
                  >
                    <th colspan="2" scope="row">
                      <div
                        transition:slide={{ duration: prefersReducedMotion ? 0 : transitionTime }}
                      >
                        {#if line.lineNumber === '6190'}
                          Footnotes for all <em>6xxx</em> lines:
                        {:else if line.lineNumber === '1920'}
                          Footnotes for all <em>1xxx</em> lines:
                        {:else}
                          Footnotes for line {line.lineNumber}{line.lineSplit
                            ? ` (${line.lineSplit})`
                            : ''}:
                        {/if}
                      </div></th
                    >
                    <td colspan="3">
                      <div
                        transition:slide={{ duration: prefersReducedMotion ? 0 : transitionTime }}
                      >
                        {#each line.footnotes as footnote}
                          <p>
                            <strong>{footnote.footnoteNumber}</strong>: {footnote.footnoteText}
                          </p>
                        {/each}
                      </div>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
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
  </section>

  <ScrollToTop />
</article>

<style>
  .tafs-heading {
    margin-bottom: 0;
  }

  .tafs-heading + ul {
    margin-bottom: var(--spacing);
  }

  .tafs-data {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-large);
    margin-bottom: var(--spacing);
  }

  .iterations ul {
    font-size: var(--font-size-small);
    margin: 0 0 var(--spacing) var(--spacing);
    padding: 0;
    list-style: none;
  }

  table thead {
    position: sticky;
    top: 0;
    background-color: var(--color-background);
  }

  tr.total {
    font-weight: bold;
    background-color: var(--color-gray-lighter);
  }

  .footnote-row {
    vertical-align: top;

    th {
      max-width: 8em;
    }

    p {
      margin-bottom: var(--spacing);
    }
  }
</style>
