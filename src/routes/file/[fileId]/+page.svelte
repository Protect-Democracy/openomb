<script lang="ts">
  import type { PageData } from './$types';
  import { uniqBy, reduce } from 'lodash-es';
  import { writable } from 'svelte/store';
  import { formatFileTitle, formatTafsFormattedId } from '$lib/formatters';
  import ScrollToTop from '$components/navigation/ScrollToTop.svelte';
  import Switch from '$components/inputs/Switch.svelte';
  import TAFSLines from './TAFSLines.svelte';
  import Metadata from './Metadata.svelte';
  import TAFSMeta from './TAFSMeta.svelte';
  import FootnoteTable from './FootnoteTable.svelte';
  import LetterApportionmentPreview from './LetterApportionmentPreview.svelte';

  // Props
  export let data: PageData;

  // States/stores
  let showPrevious = writable(true);

  // Derived
  $: letterApportionment = !!file.pdfUrl;
  $: ({ file, prevIterationFiles } = data);
  $: hasPreviousFiles = prevIterationFiles && !!Object.keys(prevIterationFiles).length;
  $: prevIterationFootnotes = uniqBy(
    reduce(
      Object.values(prevIterationFiles),
      (accum, iterFile) => {
        return [...accum, ...(iterFile.footnotes || [])];
      },
      []
    ),
    (f) => `${f.fileId}-${f.footnoteNumber}`
  );
  $: ({ tafs, footnotes } = file);
</script>

<article class="page-container content-container" class:has-previous={hasPreviousFiles}>
  <h1 class="h2">
    <span>{formatFileTitle(file)}</span>
  </h1>

  <div class="metadata-container">
    <Metadata {file} />
  </div>

  {#if letterApportionment}
    <h2>Apportionment letter</h2>

    <LetterApportionmentPreview {file} />
  {/if}

  {#if hasPreviousFiles}
    <div class="previous-toggle">
      <Switch
        id="file-show-previous"
        checked={showPrevious}
        label={`${$showPrevious ? 'Hide' : 'Show'} previous iteration`}
        variant="previous small"
      />
    </div>
  {/if}

  <section>
    {#if tafs?.length}
      <h2 class="sr-only">Schedules</h2>

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

          <TAFSMeta {tafsGroup} />

          <TAFSLines currentTafs={tafsGroup} {prevIterationTafs} showPrevious={$showPrevious} />
        </section>
      {/each}
    {:else}
      <h2>Schedules</h2>

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
      <FootnoteTable {footnotes} />
    {:else}
      <p><em>No footnotes available.</em></p>
    {/if}

    {#if $showPrevious && prevIterationFiles && Object.keys(prevIterationFiles).length > 0}
      <p class="previous-iteration-footnotes-desc">
        The following are all of the footnotes associated with the <span
          class="previous-highlight-text">previous iteration of this file</span
        >. Note that previous iterations of accounts in this file may come from multiple previous
        files.
      </p>

      {#if prevIterationFootnotes.length}
        <FootnoteTable footnotes={prevIterationFootnotes} idPrefix="footnote_previous" />
      {:else}
        <p><em>No footnotes available.</em></p>
      {/if}
    {/if}
  </section>

  <section class="page-footnotes">
    <h2 class="sr-only">Notes about this page</h2>

    <ul>
      <li id="page-footnote-funds">
        &dagger; Links to public laws are automatically generated and are not guaranteed to be
        accurate.
      </li>

      {#if letterApportionment}
        <li id="page-footnote-file-id">
          &Dagger; For letter apportionments, the file identifier is an internally assigned
          identifier and not assigned by the Office of Management and Budget.
        </li>
      {/if}
    </ul>
  </section>

  <ScrollToTop />
</article>

<style>
  .metadata-container {
    margin-bottom: var(--spacing-large);
  }

  .has-previous .metadata-container {
    margin-bottom: 0;
  }

  .tafs-section {
    margin-bottom: var(--spacing-large);
  }

  .previous-toggle {
    background-color: var(--color-background-alt);
    padding: var(--spacing) var(--spacing-double);
    margin-bottom: var(--spacing-double);
  }

  .previous-iteration-footnotes-desc {
    margin-top: var(--spacing-triple);
  }

  .previous-highlight-text {
    display: inline-block;
    padding-left: var(--spacing-tiny);
    padding-right: var(--spacing-tiny);
    background-color: var(--color-previous-unchecked);
  }

  .page-footnotes {
    padding-top: var(--spacing-large);
    font-size: var(--font-size-small);

    ul {
      padding: 0;
      margin: 0;
      list-style-type: none;
    }
  }
</style>
