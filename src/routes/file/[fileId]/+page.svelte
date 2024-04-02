<script lang="ts">
  import type { PageData } from './$types';
  import { formatCurrency } from '$lib/formatters';

  export let data: PageData;
  $: ({ file } = data);
  $: ({ tafs, footnotes } = file);

  $: console.log(file);

  function isTotalRow(line: object): boolean {
    return line.lineNumber.match(/^(1920|6190)$/);
  }
</script>

<h1>File: {data.file.fileId}</h1>

<h2>About file</h2>

<ul>
  <li>File ID: {file.fileId}</li>
  <li>Folder: {file.folder}</li>
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
      <acronym title="Treasury Appropriation Fund Symbol">TAFS</acronym>: {tafsGroup.tafsId}
    </h3>

    <ul>
      <li>Agency: <strong>{tafsGroup.budgetAgencyTitle}</strong></li>
      <li>Bureau: <strong>{tafsGroup.budgetBureauTitle}</strong></li>
      <li>Account: <strong>{tafsGroup.accountTitle}</strong></li>
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
            <a href="/file/{iteration.fileId}#tafs_{iteration.tafsTableId}">{iteration.iteration}</a
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
              {#each line.footnotes as footnote}
                <a href="#footnote__{footnote.footnoteNumber}">{footnote.footnoteNumber}</a><br />
              {/each}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/each}
{:else}
  <p><em>No schedule information available.</em></p>
{/if}

<h2>Footnotes</h2>

{#if footnotes.length}
  <table>
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
</style>
