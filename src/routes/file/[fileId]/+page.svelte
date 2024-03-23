<script lang="ts">
  import { filter as _filter, sortBy } from 'lodash-es';
  import type { PageData } from './$types';
  import { formatCurrency } from '$lib/formatters';

  export let data: PageData;

  function scheduleFindLine(schedules: object[], lineNumber: string): object {
    return schedules.find((line: object) => line.lineNumber === lineNumber) || {};
  }

  function filterSortSchedules(schedules: object[]): object[] {
    return sortBy(
      _filter(schedules, (line: object) => line.lineNumber.match(/^[0-9]+$/)),
      ['lineNumber', 'lineSplit']
    );
  }

  function isTotalRow(line: object): boolean {
    return line.lineNumber.match(/^(1920|6190)$/);
  }
</script>

<h1>File: {data.file.fileId}</h1>

<h2>About file</h2>

<ul>
  <li>File ID: {data.file.fileId}</li>
  <li>Folder: {data.file.folder}</li>
  <li>Fiscal year: {data.file.fiscalYear}</li>
  <li>Approved: {data.file.approvalTimestamp}</li>
  <li>Approved: {data.file.approverTitle}</li>
  <li>Funds provided by: {data.file.fundsProvidedBy}</li>
  {#if data.file.pdfUrl}
    <li>
      <a href={data.file.pdfUrl} target="_blank" rel="noopener noreferrer"
        >PDF file (apportionment-public.max.gov)</a
      >
    </li>
  {/if}
  {#if data.file.excelUrl}
    <li>
      <a href={data.file.excelUrl} target="_blank" rel="noopener noreferrer"
        >Excel file (apportionment-public.max.gov)</a
      >
    </li>
  {/if}
  {#if data.file.sourceUrl}
    <li>
      <a href={data.file.sourceUrl} target="_blank" rel="noopener noreferrer"
        >Source (apportionment-public.max.gov)</a
      >
    </li>
  {/if}
</ul>

<h2>Schedules</h2>

{#if data.schedules?.length}
  {#each Object.entries(data.groupedSchedules) as [tafsId, tafsGroup]}
    <h3>
      <acronym title="Treasury Appropriation Fund Symbol">TAFS</acronym>:
      {tafsGroup[0].cgacAgency}-{tafsGroup[0].cgacAcct}
      {tafsGroup[0].beginPoa}/{tafsGroup[0].endPoa}
      ({tafsId})
    </h3>

    <ul>
      <li>Agency: <strong>{tafsGroup[0].budgetAgencyTitle}</strong></li>
      <li>Bureau: <strong>{tafsGroup[0].budgetBureauTitle}</strong></li>
      <li>Account: <strong>{tafsGroup[0].accountTitle}</strong></li>
      <li>
        Iteration: <strong
          >{tafsGroup[0].iteration} - {scheduleFindLine(tafsGroup, 'IterNo')
            .lineDescription}</strong
        >
      </li>
      <li>
        Adjustment authority: <strong
          >{scheduleFindLine(tafsGroup, 'AdjAut').lineDescription} - {scheduleFindLine(
            tafsGroup,
            'AdjAut'
          ).lineSplit}</strong
        >
      </li>
      <li>
        Reporting categories: <strong
          >{scheduleFindLine(tafsGroup, 'RptCat').lineDescription} - {scheduleFindLine(
            tafsGroup,
            'RptCat'
          ).lineSplit}</strong
        >
      </li>
      <li>CGAC account: <strong>{tafsGroup[0].cgacAcct}</strong></li>
      <li>CGAC agency: <strong>{tafsGroup[0].cgacAgency}</strong></li>
    </ul>

    <table class="font-small">
      <thead>
        <tr>
          <th>Line #</th>
          <th>Split</th>
          <th>Agency code</th>
          <th>Sub-account</th>
          <!-- <th>availabilityTypeCode</th> -->
          <th>Description</th>
          <th>Amount</th>
          <th>Footnotes</th>
        </tr>
      </thead>

      <tbody>
        {#each filterSortSchedules(tafsGroup) as schedule}
          <tr class:total={isTotalRow(schedule)}>
            <td>{schedule.lineNumber}</td>
            <td>{schedule.lineSplit}</td>
            <td>{schedule.allocationAgencyCode}</td>
            <td>{schedule.allocationSubacct}</td>
            <!-- <td>{schedule.availabilityTypeCode}</td> -->
            <td>{schedule.lineDescription}</td>
            <td
              >{#if schedule.approvedAmount}{formatCurrency(schedule.approvedAmount)}{/if}</td
            >
            <td>
              {#each data.footnotes.filter((fn) => fn.scheduleIndex === schedule.scheduleIndex) as footnote}
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

{#if data.distinctFootnotes?.length}
  <table>
    <thead>
      <tr><th>Number</th><th>Text</th></tr>
    </thead>

    <tbody>
      {#each data.distinctFootnotes as footnote}
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
