<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import type { PageData } from './$types';
  import { formatCurrency, formatFileTitle, formatTafsFormattedId } from '$lib/formatters';

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

<div class="page-container">
  <h1>{formatFileTitle(file)}</h1>

  <h2>About file</h2>

  <ul>
    <li>File ID: {file.fileId}</li>
    <li>Folder: <a href="/folder/{file.folderId}">{file.folder}</a></li>
    <li>Fiscal year: {file.fiscalYear}</li>
    <li>Approved: {file.approvalTimestamp}</li>
    <li>Approved: {file.approverTitle}</li>
    <li>Funds provided by: {file.fundsProvidedBy}</li>
    {#if file.pdfUrl}
      <li>
        <a href={file.pdfUrl} target="_blank" rel="noopener noreferrer"
          >PDF file (apportionment-public.max.gov)</a
        >
      </li>
    {/if}
    {#if file.excelUrl}
      <li>
        <a href={file.excelUrl} target="_blank" rel="noopener noreferrer"
          >Excel file (apportionment-public.max.gov)</a
        >
      </li>
    {/if}
    {#if file.sourceUrl}
      <li>
        <a href={file.sourceUrl} target="_blank" rel="noopener noreferrer"
          >Source (apportionment-public.max.gov)</a
        >
      </li>
    {/if}
  </ul>

  <h2>Schedules (what to call this?)</h2>

  {#if tafs?.length}
    {#each tafs as tafsGroup}
      <h3 id="tafs_{tafsGroup.tafsTableId}">
        <acronym title="Treasury Appropriation Fund Symbol">TAFS</acronym>: {formatTafsFormattedId(
          tafsGroup
        )}
      </h3>

      <ul>
        <li>
          Agency: <strong
            ><a href="/agency/{tafsGroup.budgetAgencyTitleId}">{tafsGroup.budgetAgencyTitle}</a
            ></strong
          >
        </li>
        <li>
          Bureau: <strong
            ><a
              href="/agency/{tafsGroup.budgetAgencyTitleId}/bureau/{tafsGroup.budgetBureauTitleId}"
              >{tafsGroup.budgetBureauTitle}</a
            ></strong
          >
        </li>
        <li>
          Account: <strong
            ><a
              href="/agency/{tafsGroup.budgetAgencyTitleId}/bureau/{tafsGroup.budgetBureauTitleId}/account/{tafsGroup.accountTitleId}"
              >{tafsGroup.accountTitle}</a
            ></strong
          >
        </li>
        <li>
          Iteration: <strong>{tafsGroup.iteration} - {tafsGroup.iterationDescription}</strong>
        </li>
        <li>
          Adjustment authority: <strong>{tafsGroup.adjAut}</strong>
        </li>
        <li>
          Reporting categories: <strong>{tafsGroup.rptCat}</strong>
        </li>
        <li>CGAC agency: <strong>{tafsGroup.cgacAgency}</strong></li>
        <li>CGAC account: <strong>{tafsGroup.cgacAcct}</strong></li>
        <li>Allocation agency code: <strong>{tafsGroup.allocationAgencyCode}</strong></li>
        <li>Allocation sub-account: <strong>{tafsGroup.allocationSubacct}</strong></li>
        <li>
          <acronym title="Period of availability">POA</acronym> begin:
          <strong>{tafsGroup.beginPoa}</strong>
        </li>
        <li>
          <acronym title="Period of availability">POA</acronym> end:
          <strong>{tafsGroup.endPoa}</strong>
        </li>
        <li>
          Iterations:
          {#each tafsGroup.iterations as iteration}
            {#if iteration.iteration === tafsGroup.iteration}
              <span>{iteration.iteration} (current)</span>,
            {:else}
              <a href="/file/{iteration.fileId}#tafs_{iteration.tafsTableId}"
                >{iteration.iteration}</a
              >,
            {/if}
          {/each}
        </li>
      </ul>

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
                    aria-expanded={footnotesExpanded[`${tafsGroup.tafsTableId}-${line.lineNumber}`]
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
    {/each}
  {:else}
    <p><em>No schedule information available.</em></p>
  {/if}

  <h2>Footnotes</h2>

  <p>
    The following are all the footnotes associated with this file. Note that a footnote can be used
    for multiple lines across multiple accounts. This is simply a reference for the information that
    is already included above.
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
</div>

<style>
  table thead {
    position: sticky;
    top: 0;
    background-color: var(--color-background);
  }

  tr.total {
    font-weight: bold;
    background-color: var(--color-gray-light);
  }

  .footnote-row {
    vertical-align: top;
  }
</style>
