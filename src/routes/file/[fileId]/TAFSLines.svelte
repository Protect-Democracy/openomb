<script lang="ts">
  import { sortBy, forEach } from 'lodash-es';
  import { slide } from 'svelte/transition';
  import { formatCurrency } from '$lib/formatters';
  import { prefersReducedMotion } from '$lib/utilities';

  export let currentTafs: object;
  export let prevIterationTafs: object;

  // Constants
  const transitionTime = 300;

  function combinedTafsLines(tafs) {
    const lines = {};
    forEach(tafs, (taf) => {
      if (taf) {
        forEach(taf.lines, (line, index) => {
          const lineId = `${line.lineNumber} ${line.lineSplit}`;
          if (!lines[lineId]) {
            lines[lineId] = { order: index };
          }
          lines[lineId][taf.iteration] = line;
        });
      }
    });
    return sortBy(lines, ['order']);
  }
  $: lineIterationMap = combinedTafsLines([currentTafs, prevIterationTafs]);

  // Keep track of if footnote is expanded.  Default to false
  let footnotesExpanded: Record<string, boolean> = {};
  $: forEach(currentTafs.lines, (line) => {
    const id = `${currentTafs.tafsTableId}-${line.lineIndex}`;
    footnotesExpanded[id] =
      footnotesExpanded[id] === undefined ? false : footnotesExpanded[id] === false ? false : true;
  });
  $: forEach(prevIterationTafs?.lines, (line) => {
    const id = `${prevIterationTafs.tafsTableId}-${line.lineIndex}`;
    footnotesExpanded[id] =
      footnotesExpanded[id] === undefined ? false : footnotesExpanded[id] === false ? false : true;
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

<div class="responsive-table">
  <table class="font-small">
    <thead>
      {#if prevIterationTafs}
        <tr class="subheader">
          <th colspan="3"></th>
          <th colspan="2">Previous Approved (Iteration #{prevIterationTafs.iteration})</th>
          <th colspan="2">Current OMB Action (Iteration #{currentTafs.iteration})</th>
        </tr>
      {/if}
      <tr>
        <th>Line #</th>
        <th>Split</th>
        <th>Description</th>
        {#if prevIterationTafs}
          <th class="currency-column">Amount</th>
          <th>Footnotes</th>
        {/if}
        <th class="currency-column">Amount</th>
        <th>Footnotes</th>
      </tr>
    </thead>

    <tbody>
      {#each Object.keys(lineIterationMap) as lineNumber}
        {@const currentIterationLine = lineIterationMap[lineNumber][currentTafs.iteration]}
        {@const prevIterationLine = prevIterationTafs
          ? lineIterationMap[lineNumber][prevIterationTafs.iteration]
          : undefined}
        <tr class:total={isTotalRow(currentIterationLine || prevIterationLine)}>
          <td>{(currentIterationLine || prevIterationLine).lineNumber}</td>
          <td>{(currentIterationLine || prevIterationLine).lineSplit}</td>
          <td>{(currentIterationLine || prevIterationLine).lineDescription}</td>
          {#if prevIterationTafs}
            {#if prevIterationLine}
              <td class="currency-column">
                {#if prevIterationLine.approvedAmount}{formatCurrency(
                    prevIterationLine.approvedAmount
                  )}{/if}
              </td>
              <td>
                {#if prevIterationLine.footnotes && prevIterationLine.footnotes.length > 0}
                  <span class="no-js-only-inline"><small>See footnotes below</small></span>
                  <span class="has-js-only-inline">
                    <button
                      class="compact small"
                      aria-expanded={footnotesExpanded[
                        `${prevIterationTafs.tafsTableId}-${prevIterationLine.lineIndex}`
                      ]
                        ? true
                        : false}
                      aria-controls="inline-footnotes-{prevIterationTafs.tafsTableId}-{prevIterationLine.lineIndex}"
                      on:click={(e) =>
                        toggleFootnote(
                          `${prevIterationLine.tafsTableId}-${prevIterationLine.lineIndex}`,
                          e
                        )}>Footnotes</button
                    >
                  </span>
                {/if}
              </td>
            {:else if currentIterationLine && !prevIterationLine}
              <td colspan="2" class="missing-line-column"> Line added </td>
            {/if}
          {/if}
          {#if currentIterationLine}
            <td class="currency-column">
              {#if currentIterationLine.approvedAmount}{formatCurrency(
                  currentIterationLine.approvedAmount
                )}{/if}
            </td>
            <td>
              {#if currentIterationLine.footnotes && currentIterationLine.footnotes.length > 0}
                <span class="no-js-only-inline"><small>See footnotes below</small></span>
                <span class="has-js-only-inline">
                  <button
                    class="compact small"
                    aria-expanded={footnotesExpanded[
                      `${currentTafs.tafsTableId}-${currentIterationLine.lineIndex}`
                    ]
                      ? true
                      : false}
                    aria-controls="inline-footnotes-{currentTafs.tafsTableId}-{currentIterationLine.lineIndex}"
                    on:click={(e) =>
                      toggleFootnote(
                        `${currentIterationLine.tafsTableId}-${currentIterationLine.lineIndex}`,
                        e
                      )}>Footnotes</button
                  >
                </span>
              {/if}
            </td>
          {:else if prevIterationLine && !currentIterationLine}
            <td colspan="2" class="missing-line-column"> Line removed </td>
          {/if}
        </tr>

        {#if prevIterationTafs && prevIterationLine && prevIterationLine.footnotes && prevIterationLine.footnotes.length > 0}
          <tr
            class="footnote-row no-js-only-table-row"
            id="inline-footnotes-{prevIterationTafs.tafsTableId}-{prevIterationLine.lineIndex}"
          >
            <th colspan="2" scope="row">
              Footnotes for line {prevIterationLine.lineNumber}{prevIterationLine.lineSplit
                ? ` (${prevIterationLine.lineSplit})`
                : ''} (Previous):</th
            >
            <td colspan="3">
              {#each prevIterationLine.footnotes as footnote}
                <p>
                  <strong>{footnote.footnoteNumber}</strong>: {footnote.footnoteText}
                </p>
              {/each}
            </td>
          </tr>
        {/if}

        {#if currentIterationLine && currentIterationLine.footnotes && currentIterationLine.footnotes.length > 0}
          <tr
            class="footnote-row no-js-only-table-row"
            id="inline-footnotes-{currentTafs.tafsTableId}-{currentIterationLine.lineIndex}"
          >
            <th colspan="2" scope="row">
              Footnotes for line {currentIterationLine.lineNumber}{currentIterationLine.lineSplit
                ? ` (${currentIterationLine.lineSplit})`
                : ''}{prevIterationTafs ? ' (Current)' : ''}:</th
            >
            <td colspan="3">
              {#each currentIterationLine.footnotes as footnote}
                <p>
                  <strong>{footnote.footnoteNumber}</strong>: {footnote.footnoteText}
                </p>
              {/each}
            </td>
          </tr>
        {/if}

        {#if prevIterationTafs && prevIterationLine && prevIterationLine.footnotes && prevIterationLine.footnotes.length > 0 && footnotesExpanded[`${prevIterationTafs.tafsTableId}-${prevIterationLine.lineIndex}`]}
          <!-- TODO: TRs don't care about height and so slide() transition does not work on them.  Tried creating a custom transition that managed max-height, but that did not work.  Adding transition to inner elements here works, but its a bit jumpy with the tr thing.  -->
          <tr
            class="footnote-row has-js-only-table-row"
            id="inline-footnotes-{prevIterationTafs.tafsTableId}-{prevIterationLine.lineIndex}"
          >
            <th colspan="2" scope="row">
              <div transition:slide={{ duration: prefersReducedMotion ? 0 : transitionTime }}>
                {#if lineNumber === '6190'}
                  Footnotes for all <em>6xxx</em> lines (Previous):
                {:else if lineNumber === '1920'}
                  Footnotes for all <em>1xxx</em> lines (Previous):
                {:else}
                  Footnotes for line {prevIterationLine.lineNumber}{prevIterationLine.lineSplit
                    ? ` (${prevIterationLine.lineSplit})`
                    : ''} (Previous):
                {/if}
              </div></th
            >
            <td colspan="3">
              <div transition:slide={{ duration: prefersReducedMotion ? 0 : transitionTime }}>
                {#each prevIterationLine.footnotes as footnote}
                  <p>
                    <strong>{footnote.footnoteNumber}</strong>: {footnote.footnoteText}
                  </p>
                {/each}
              </div>
            </td>
          </tr>
        {/if}

        {#if currentIterationLine && currentIterationLine.footnotes && currentIterationLine.footnotes.length > 0 && footnotesExpanded[`${currentTafs.tafsTableId}-${currentIterationLine.lineIndex}`]}
          <!-- TODO: TRs don't care about height and so slide() transition does not work on them.  Tried creating a custom transition that managed max-height, but that did not work.  Adding transition to inner elements here works, but its a bit jumpy with the tr thing.  -->
          <tr
            class="footnote-row has-js-only-table-row"
            id="inline-footnotes-{currentTafs.tafsTableId}-{currentIterationLine.lineIndex}"
          >
            <th colspan="2" scope="row">
              <div transition:slide={{ duration: prefersReducedMotion ? 0 : transitionTime }}>
                {#if lineNumber === '6190'}
                  Footnotes for all <em>6xxx</em> lines{prevIterationTafs ? ' (Current)' : ''}:
                {:else if lineNumber === '1920'}
                  Footnotes for all <em>1xxx</em> lines{prevIterationTafs ? ' (Current)' : ''}:
                {:else}
                  Footnotes for line {currentIterationLine.lineNumber}{currentIterationLine.lineSplit
                    ? ` (${currentIterationLine.lineSplit})`
                    : ''}{prevIterationTafs ? ' (Current)' : ''}:
                {/if}
              </div></th
            >
            <td colspan="3">
              <div transition:slide={{ duration: prefersReducedMotion ? 0 : transitionTime }}>
                {#each currentIterationLine.footnotes as footnote}
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
</div>

<style>
  .responsive-table,
  table {
    position: relative;
  }

  table thead {
    /* TODO: .responsive-table element seems to mess with this */
    position: sticky;
    top: 0;
    background-color: var(--color-background);
    /* TODO: This does not come through when sticky; it is set as the default too */
    border-bottom: var(--border-weight) solid var(--color-text);
  }

  table tr.subheader {
    color: var(--color-text-muted);
    text-align: center;
  }

  .subheader th {
    padding-bottom: 0;
  }

  .currency-column {
    text-align: right;
    padding-right: var(--spacing-double);
  }

  .missing-line-column {
    color: var(--color-text-muted);
    text-align: center;
  }

  tr.total {
    font-weight: bold;
    background-color: var(--color-gray-lighter);
    border-bottom: double var(--color-text);
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
