<script lang="ts">
  import { sortBy, forEach } from 'lodash-es';
  import { slide } from 'svelte/transition';
  import { formatCurrency } from '$lib/formatters';
  import { prefersReducedMotion } from '$lib/utilities';

  // Props
  export let currentTafs: object;
  export let prevIterationTafs: object;
  export let showPrevious: boolean;

  // Constants
  const transitionTime = 300;

  // Combine lines
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

  // Derived
  $: showingPrevious = showPrevious && !!prevIterationTafs;

  // Reactivity
  $: {
    if (showPrevious === false) {
      toggleOffAllFootnotes();
    }
  }

  // Methods
  function toggleFootnote(id: string, event: Event): void {
    event?.preventDefault();
    footnotesExpanded = {
      ...footnotesExpanded,
      [id]: !footnotesExpanded[id]
    };
    return;
  }

  function toggleOffAllFootnotes() {
    let updated = {};
    Object.keys(footnotesExpanded).forEach((key) => {
      updated[key] = false;
    });
    footnotesExpanded = updated;
  }

  function isTotalRow(line: object): boolean {
    return line.lineNumber.match(/^(1920|6190)$/);
  }
</script>

<div class="responsive-table">
  <table class="font-small" class:has-previous={showingPrevious}>
    <thead>
      {#if showingPrevious}
        <tr class="iteration-header">
          <th colspan="3"></th>
          <th colspan="2" class="previous-highlight"
            >Previously approved (Iteration {prevIterationTafs.iteration})</th
          >
          <th colspan="2">Current OMB Action (Iteration {currentTafs.iteration})</th>
        </tr>
      {/if}

      <tr class="data-header">
        <th>Line #</th>
        <th>Split</th>
        <th>Description</th>
        {#if showingPrevious}
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

          {#if showingPrevious}
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
              <td class="missing-line-column">Line added</td>
              <td class="missing-line-column"></td>
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
          {:else if showingPrevious && !currentIterationLine}
            <td class="missing-line-column">Line removed</td>
            <td></td>
          {/if}
        </tr>

        {#if showingPrevious && prevIterationLine && prevIterationLine.footnotes && prevIterationLine.footnotes.length > 0}
          <tr
            class="footnote-row no-js-only-table-row"
            id="inline-footnotes-{prevIterationTafs.tafsTableId}-{prevIterationLine.lineIndex}"
          >
            <th colspan="2" scope="row">
              Footnotes for line
              {prevIterationLine.lineNumber}{prevIterationLine.lineSplit
                ? ` (${prevIterationLine.lineSplit})`
                : ''} (Previous):
            </th>

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
                : ''}{showingPrevious ? ' (Current)' : ''}:
            </th>
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
                  Footnotes for all <em>6xxx</em> lines{showingPrevious ? ' (Current)' : ''}:
                {:else if lineNumber === '1920'}
                  Footnotes for all <em>1xxx</em> lines{showingPrevious ? ' (Current)' : ''}:
                {:else}
                  Footnotes for line {currentIterationLine.lineNumber}{currentIterationLine.lineSplit
                    ? ` (${currentIterationLine.lineSplit})`
                    : ''}{showingPrevious ? ' (Current)' : ''}:
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

      {#if showingPrevious}
        <tr class="previous-bottom-cap">
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<style>
  .responsive-table,
  table {
    position: relative;
  }

  table button {
    margin: 0;
  }

  table thead {
    /* TODO: .responsive-table element seems to mess with this */
    position: sticky;
    top: 0;
    background-color: var(--color-background);
    /* TODO: This does not come through when sticky; it is set as the default too */
    border-bottom: var(--border-weight) solid var(--color-text);
  }

  .currency-column {
    text-align: right;
    padding-right: var(--spacing-double);
  }

  .missing-line-column {
    color: var(--color-previous-unchecked);
    text-align: right;
    padding-right: var(--spacing-double);
  }

  tr.total {
    font-weight: bold;
    background-color: var(--color-gray-lighter);
    border-bottom: calc(var(--border-weight) * 2) double var(--color-text);
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

  .has-previous {
    .iteration-header {
      text-align: center;
    }

    thead tr.iteration-header th:nth-child(2) {
      border-left: var(--border-weight) solid var(--color-previous-checked);
      border-top: var(--border-weight) solid var(--color-previous-checked);
      border-right: var(--border-weight) solid var(--color-previous-checked);
      padding-bottom: var(--spacing-small);
    }

    thead tr.data-header th:nth-child(4),
    tbody tr td:nth-child(4) {
      border-left: var(--border-weight) solid var(--color-previous-checked);
    }
    thead tr.data-header th:nth-child(5),
    tbody tr td:nth-child(5) {
      border-right: var(--border-weight) solid var(--color-previous-checked);
    }

    .previous-bottom-cap {
      border-bottom: 0;

      & td:nth-child(4) {
        border-left: var(--border-weight) solid var(--color-previous-checked);
        border-bottom: var(--border-weight) solid var(--color-previous-checked);
      }

      & td:nth-child(5) {
        border-right: var(--border-weight) solid var(--color-previous-checked);
        border-bottom: var(--border-weight) solid var(--color-previous-checked);
      }
    }
  }

  .previous-highlight {
    background-color: var(--color-previous-unchecked);
  }
</style>
