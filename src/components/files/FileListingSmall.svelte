<script lang="ts">
  import {
    formatFileTitle,
    formatDate,
    formatDateISO,
    highlight,
    formatTafsFormattedId,
    highlightOrder,
    hasHighlight
  } from '$lib/formatters';
  import { uniqBy, flatMap, filter } from 'lodash-es';
  import type { filesSelect } from '$db/schema/files';
  import type { tafsSelect } from '$db/schema/tafs';
  import type { SearchParams } from '$db/queries/search';

  // Types
  interface File extends filesSelect {
    tafs?: tafsSelect[];
  }

  // Props
  export let headerElement = 'h3';
  export let headerClasses = 'h3-alt';
  export let file: File;
  export let highlightParams: SearchParams;

  // Constants
  const tafsLimit = 3;
  const footnotesLimit = 3;

  // Derived
  let hasTafs: boolean;
  $: hasTafs = file.tafs && file.tafs.length > 0 ? true : false;
  $: hasFootnotes = file.footnotes && file.footnotes.length > 0 ? true : false;
  $: agencies = highlightOrder(
    uniqBy(
      file?.tafs?.map((t) => ({
        id: t.budgetAgencyTitleId,
        title: t.budgetAgencyTitle,
        highlightedTitle: highlight(t.budgetAgencyTitle, [highlightParams?.term])
      })) || [],
      'id'
    ),
    'highlightedTitle'
  );
  $: bureaus = highlightOrder(
    uniqBy(
      file?.tafs?.map((t) => ({
        id: t.budgetBureauTitleId,
        title: t.budgetBureauTitle,
        highlightedTitle: highlight(t.budgetBureauTitle, [highlightParams?.term])
      })) || [],
      'id'
    ),
    'highlightedTitle'
  );
  $: tafs = highlightOrder(
    uniqBy(
      file?.tafs?.map((t) => ({
        id: t.tafsId,
        title: formatTafsFormattedId(t),
        highlightedTitle: highlight(formatTafsFormattedId(t), [highlightParams?.tafs])
      })) || [],
      'id'
    ),
    'highlightedTitle'
  );
  $: allLines = highlightOrder(
    (filter(flatMap(file?.tafs, 'lines')) || []).map((l) => ({
      ...l,
      id: `${l.tafsTableId}-${l.lineIndex}`,
      highlightedDescription: highlight(l.lineDescription, [highlightParams?.term]),
      hasHighlight: hasHighlight(highlight(l.lineDescription, [highlightParams?.term]))
    })),
    'highlightedDescription'
  );
  $: hasHighlightedLines = allLines.some((l) => l.hasHighlight);
  $: footnotes = highlightOrder(
    uniqBy(
      file?.footnotes?.map((f) => ({
        id: f.footnoteNumber,
        text: f.footnoteText,
        highlightedText: highlight(f.footnoteText, [highlightParams?.term], 100),
        hasHighlight: hasHighlight(highlight(f.footnoteText, [highlightParams?.term], 100))
      })),
      'id'
    ),
    'highlightedText'
  );
  $: hasHighlightedFootnotes = footnotes.some((f) => f.hasHighlight);
</script>

<article class="file-listing-small">
  <svelte:element this={headerElement} class="listing-heading {headerClasses}">
    <small>File ID: {file.fileId}</small>
    <a href="/file/{file.fileId}">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html formatFileTitle(file, [highlightParams?.term, highlightParams?.account])}</a
    >
  </svelte:element>

  <ul class="inline-list heirarchy">
    {#if !hasTafs}
      <li>
        <a class="like-text" title="Go to folder: {file.folder}" href="/folder/{file.folderId}"
          >{file.folder}</a
        >
      </li>
    {:else}
      <li>
        <a
          class="like-text"
          title="Go to agency: {agencies[0].title}"
          href="/agency/{agencies[0].id}"
          ><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html agencies[0].highlightedTitle || agencies[0].title}</a
        >{agencies.length > 1 ? ` + ${agencies.length - 1}` : ''}
      </li>

      <li>
        <a
          class="like-text"
          title="Go to bureau: {bureaus[0].title}"
          href="/agency/{agencies[0].id}/bureau/{bureaus[0].id}"
          ><!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html bureaus[0].highlightedTitle || bureaus[0].title}</a
        >{bureaus.length > 1 ? ` + ${bureaus.length - 1}` : ''}
      </li>
    {/if}
  </ul>

  <div class="published-date">
    Approved <strong
      ><time datetime={formatDateISO(file.approvalTimestamp)}
        >{formatDate(file.approvalTimestamp, 'medium')}</time
      ></strong
    >
    for fiscal year
    <strong>{file.fiscalYear?.toString()}</strong>.
  </div>

  {#if hasTafs}
    <section class="tafs">
      <acronym title="Treasury Appropriation Fund Symbol">TAFS</acronym>:
      {#each tafs as taf, ti (taf.id)}
        {#if ti < tafsLimit}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <span
            ><!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html taf.highlightedTitle || taf.title}</span
          >{#if ti < tafsLimit - 1 && tafs.length - 1 !== ti}<span>,&nbsp;</span>
          {/if}
        {/if}
      {/each}
    </section>
  {/if}

  {#if hasFootnotes && hasHighlightedFootnotes}
    <section class="footnotes font-small text-container">
      <ul>
        {#each footnotes as footnote, fi (footnote.id)}
          {#if footnote.hasHighlight && fi < footnotesLimit}
            <li>
              {fi === 0 ? 'Footnote ' : ''}{footnote.id}:
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html footnote.highlightedText}
            </li>
          {/if}
        {/each}
      </ul>
    </section>
  {/if}

  {#if allLines?.length > 0 && hasHighlightedLines}
    <section class="lines font-small text-container">
      <ul>
        {#each allLines as line, li (line.id)}
          {#if line.hasHighlight && li < footnotesLimit}
            <li>
              {li === 0 ? 'Line ' : ''}{line.lineNumber}:
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html line.highlightedDescription}
            </li>
          {/if}
        {/each}
      </ul>
    </section>
  {/if}
</article>

<style>
  .file-listing-small {
    margin-bottom: var(--spacing-double);
  }

  .listing-heading {
    padding-top: 0;
    margin-bottom: 0;
  }
</style>
