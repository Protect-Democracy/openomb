<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import type { PageData } from './$types';
  import {
    formatCurrency,
    formatFileTitle,
    formatTafsFormattedId,
    formatDate
  } from '$lib/formatters';

  export let data: PageData;
  $: ({ file } = data);
  $: ({ tafs, footnotes } = file);

  // Keep track of if footnote is expanded.  Default to true, and close onmount
  let footnotesExpanded: Record<string, boolean> = {};
  $: tafs.forEach((tafsGroup) => {
    tafsGroup.lines.forEach((line) => {
      footnotesExpanded[`${tafsGroup.tafsTableId}-${line.lineNumber}`] =
        footnotesExpanded[`${tafsGroup.tafsTableId}-${line.lineNumber}`] === false ? false : true;
    });
  });

  onMount(() => {
    tafs.forEach((tafsGroup) => {
      tafsGroup.lines.forEach((line) => {
        footnotesExpanded[`${tafsGroup.tafsTableId}-${line.lineNumber}`] = false;
      });
    });
  });

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
    <strong>{file.approverTitle}</strong>
    for fiscal year <strong>{file.fiscalYear}</strong>
    {#if file.fundsProvidedByParsed}
      provided by
      <strong>{file.fundsProvidedByParsed}</strong>
    {/if}
    filed under folder
    <a href="/folder/{file.folderId}">{file.folder}</a>.
  </p>

  <p class="font-small">
    Sources:
    {#if file.pdfUrl}
      <a href={file.pdfUrl} target="_blank" rel="noopener noreferrer">PDF</a>,
    {/if}
    {#if file.excelUrl}
      <a href={file.excelUrl} target="_blank" rel="noopener noreferrer">Excel</a>,
    {/if}
    {#if file.sourceUrl}
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
                      <button
                        class="compact small"
                        aria-expanded={footnotesExpanded[
                          `${tafsGroup.tafsTableId}-${line.lineNumber}`
                        ]
                          ? true
                          : false}
                        aria-controls="inline-footnotes-{tafsGroup.tafsTableId}-{line.lineNumber}"
                        on:click={(e) =>
                          toggleFootnote(`${tafsGroup.tafsTableId}-${line.lineNumber}`, e)}
                        >Footnotes</button
                      >
                    {/if}
                  </td>
                </tr>
                {#if line.footnotes && line.footnotes.length > 0 && footnotesExpanded[`${tafsGroup.tafsTableId}-${line.lineNumber}`]}
                  <tr
                    transition:slide={{}}
                    class="footnote-row"
                    id="inline-footnotes-{tafsGroup.tafsTableId}-{line.lineNumber}"
                  >
                    <th colspan="2" scope="row">Footnotes for line {line.lineNumber}:</th>
                    <td colspan="3">
                      {#each line.footnotes as footnote}
                        <p>
                          <strong>{footnote.footnoteNumber}</strong>: {footnote.footnoteText}
                        </p>
                      {/each}
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
      The following are all the footnotes associated with this file. Note that a footnote can be
      used for multiple lines across multiple accounts. This is simply a reference for the
      information that is already included above.
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
  }
</style>
