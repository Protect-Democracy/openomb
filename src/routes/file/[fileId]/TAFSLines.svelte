<script lang="ts">
  import { sortBy, forEach, maxBy } from 'lodash-es';
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

  // Keep track of if footnote is expanded.  Default to false.
  let footnotesExpanded: Record<string, boolean> = {};
  $: forEach(currentTafs.lines, (line) => {
    const id = `${line.lineNumber}-${line.lineSplit}`;
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
  $: isLatestIteration =
    currentTafs &&
    currentTafs.iterations &&
    currentTafs.iteration === maxBy(currentTafs.iterations, 'iteration').iteration;

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
      <tr class="data-header">
        <th>Line&nbsp;#</th>
        <th>Split</th>
        <th>Description</th>
        {#if showingPrevious}
          <th class="currency-column previous-highlight">
            Iteration {prevIterationTafs.iteration}
            <br />
            Previously Approved Amount
          </th>
        {/if}
        <th class="currency-column">
          {#if showingPrevious}
            Iteration {currentTafs.iteration}
            <br />
            {#if isLatestIteration}Current{/if}
            OMB Action Amount
          {:else}
            Amount
          {/if}
        </th>
        <th>Footnotes</th>
      </tr>
    </thead>

    <tbody>
      {#each Object.keys(lineIterationMap) as lineNumber}
        {@const currentIterationLine = lineIterationMap[lineNumber][currentTafs.iteration]}
        {@const prevIterationLine = prevIterationTafs
          ? lineIterationMap[lineNumber][prevIterationTafs.iteration]
          : undefined}
        {@const lineId = `${(currentIterationLine || prevIterationLine).lineNumber}-${(currentIterationLine || prevIterationLine).lineSplit}`}
        {@const previousAmount = prevIterationLine ? prevIterationLine.approvedAmount || 0 : 0}
        {@const currentAmount = currentIterationLine ? currentIterationLine.approvedAmount || 0 : 0}
        {@const change = currentAmount - previousAmount}

        {#if showingPrevious || (!showingPrevious && currentIterationLine)}
          <tr
            class:total={isTotalRow(currentIterationLine || prevIterationLine)}
            class:has-change={!!change}
          >
            <td>{(currentIterationLine || prevIterationLine).lineNumber}</td>
            <td>{(currentIterationLine || prevIterationLine).lineSplit}</td>
            <td>{(currentIterationLine || prevIterationLine).lineDescription}</td>

            {#if showingPrevious}
              {#if prevIterationLine}
                <td class="currency-column">
                  <span class:zero-amount={!prevIterationLine.approvedAmount}>
                    {formatCurrency(prevIterationLine.approvedAmount)}
                  </span>

                  {#if change}
                    <br />
                    <span class="previous-highlight-text font-small">
                      {change > 0 ? '+' : ''}{formatCurrency(change)}
                    </span>
                  {/if}
                </td>
              {:else if currentIterationLine && !prevIterationLine}
                <td class="missing-line-column">
                  <span class="sr-only">Line added</span>&mdash;

                  {#if change}
                    <br />
                    <span class="previous-highlight-text font-small">
                      {change > 0 ? '+' : ''}{formatCurrency(change)}
                    </span>
                  {/if}
                </td>
              {/if}
            {/if}

            {#if currentIterationLine}
              <td class="currency-column">
                <span class:zero-amount={!currentIterationLine.approvedAmount}>
                  {formatCurrency(currentIterationLine.approvedAmount)}
                </span>
              </td>
            {:else if showingPrevious && !currentIterationLine}
              <td class="missing-line-column">
                <span class="sr-only">Line removed</span>&mdash;
              </td>
            {/if}

            <td>
              {#if (currentIterationLine && currentIterationLine.footnotes && currentIterationLine.footnotes.length > 0) || (prevIterationLine && prevIterationLine.footnotes && prevIterationLine.footnotes.length > 0)}
                <span class="no-js-only-inline"><small>See footnotes below</small></span>
                <span class="has-js-only-inline">
                  <button
                    class="compact small"
                    aria-expanded={footnotesExpanded[lineId] ? true : false}
                    aria-controls="inline-footnotes-{lineId}-current inline-footnotes-{lineId}-previous"
                    on:click={(e) => toggleFootnote(lineId, e)}>Footnotes</button
                  >
                </span>
              {/if}
            </td>
          </tr>
        {/if}

        <!-- No JS previous footnotes-->
        {#if showingPrevious && prevIterationLine && prevIterationLine.footnotes && prevIterationLine.footnotes.length > 0}
          <tr
            class="footnote-row no-js-only-table-row previous-footnote"
            id="inline-footnotes-{lineId}-current-no-js"
          >
            <th colspan="2" scope="row">
              Footnotes for line
              {prevIterationLine.lineNumber}{prevIterationLine.lineSplit
                ? ` (${prevIterationLine.lineSplit})`
                : ''} (Previous):
            </th>

            <td colspan="4">
              {#each prevIterationLine.footnotes as footnote}
                <p>
                  <strong>{footnote.footnoteNumber}</strong>: {footnote.footnoteText}
                </p>
              {/each}
            </td>
          </tr>
        {/if}

        <!-- No JS previous footnotes-->
        {#if currentIterationLine && currentIterationLine.footnotes && currentIterationLine.footnotes.length > 0}
          <tr
            class="footnote-row no-js-only-table-row"
            id="inline-footnotes-{lineId}-current-no-js"
          >
            <th colspan="2" scope="row">
              Footnotes for line {currentIterationLine.lineNumber}{currentIterationLine.lineSplit
                ? ` (${currentIterationLine.lineSplit})`
                : ''}{showingPrevious ? ' (Current)' : ''}:
            </th>
            <td colspan={showingPrevious ? 4 : 3}>
              {#each currentIterationLine.footnotes as footnote}
                <p>
                  <strong>{footnote.footnoteNumber}</strong>: {footnote.footnoteText}
                </p>
              {/each}
            </td>
          </tr>
        {/if}

        <!-- JS previous footnotes-->
        {#if showingPrevious && prevIterationTafs && prevIterationLine && prevIterationLine.footnotes && prevIterationLine.footnotes.length > 0 && footnotesExpanded[lineId]}
          <!-- TODO: TRs don't care about height and so slide() transition does not work on them.  Tried creating a custom transition that managed max-height, but that did not work.  Adding transition to inner elements here works, but its a bit jumpy with the tr thing.  -->
          <tr
            class="footnote-row has-js-only-table-row previous-footnote"
            id="inline-footnotes-{lineId}-previous"
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
            <td colspan="4">
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

        <!-- JS current footnotes-->
        {#if currentIterationLine && currentIterationLine.footnotes && currentIterationLine.footnotes.length > 0 && footnotesExpanded[lineId]}
          <!-- TODO: TRs don't care about height and so slide() transition does not work on them.  Tried creating a custom transition that managed max-height, but that did not work.  Adding transition to inner elements here works, but its a bit jumpy with the tr thing.  -->
          <tr class="footnote-row has-js-only-table-row" id="inline-footnotes-{lineId}-current">
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
            <td colspan={showingPrevious ? 4 : 3}>
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

  .currency-column {
    text-align: right;
    padding-right: var(--spacing-double);

    @media (max-width: 1000px) {
      & {
        padding-right: var(--spacing);
      }
    }
  }

  .has-previous .has-change .currency-column {
    vertical-align: top;
  }

  .zero-amount {
    color: var(--color-text-muted);
  }

  .missing-line-column {
    color: var(--color-previous-checked);
    text-align: right;
    padding-right: var(--spacing-double);

    @media (max-width: 1000px) {
      & {
        padding-right: var(--spacing);
      }
    }
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
    thead tr.data-header th:nth-child(4) {
      border-top: var(--border-weight) solid var(--color-previous-checked);
    }

    thead tr.data-header th:nth-child(4),
    tbody tr td:nth-child(4) {
      border-left: var(--border-weight) solid var(--color-previous-checked);
      border-right: var(--border-weight) solid var(--color-previous-checked);
    }

    .previous-bottom-cap {
      border-bottom: 0;

      & td:nth-child(4) {
        border-left: var(--border-weight) solid var(--color-previous-checked);
        border-bottom: var(--border-weight) solid var(--color-previous-checked);
        border-right: var(--border-weight) solid var(--color-previous-checked);
        border-bottom: var(--border-weight) solid var(--color-previous-checked);
      }
    }
  }

  .previous-footnote th {
    background-color: var(--color-previous-unchecked);
  }

  .previous-highlight {
    background-color: var(--color-previous-unchecked);
  }

  .previous-highlight-text {
    color: var(--color-previous-checked);
  }
</style>
