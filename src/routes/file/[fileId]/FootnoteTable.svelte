<script lang="ts">
  import { resolve } from '$app/paths';
  import { uniqBy, orderBy } from 'lodash-es';
  import type { FileDetailsFootnote } from '$queries/files';

  // Props
  export let footnotes: FileDetailsFootnote[];
  export let idPrefix: string = 'footnote';

  // Derived
  $: sortedFootnotes = sortFootnotes(footnotes);
  $: hasMultipleFiles = footnotes && footnotes.length > 1 && uniqBy(footnotes, 'fileId').length > 1;

  // Methods
  function sortFootnotes(footnotes: FileDetailsFootnote[]) {
    // Footnote numbers are like A1, B12, etc, though some are very different.
    // There may be multiple files include in footnote list.
    return orderBy(footnotes, [
      'fileId',
      (f) => f.footnoteNumber.replace(/\d/g, ''),
      (f) => parseInt(f.footnoteNumber.replace(/\D/g, ''))
    ]);
  }
</script>

<table class="font-small">
  <thead>
    <tr>
      {#if hasMultipleFiles}
        <th>File</th>
      {/if}
      <th>Number</th>
      <th>Text</th>
    </tr>
  </thead>

  <tbody>
    {#each sortedFootnotes as footnote, i (`${footnote.footnoteNumber}-${i}`)}
      <tr>
        {#if hasMultipleFiles}
          <td>
            {#if footnote.fileId}
              <a href={resolve('/file/[fileId]', { fileId: footnote.fileId })}>{footnote.fileId}</a>
            {/if}
          </td>
        {/if}

        <td id="{idPrefix}__{footnote.footnoteNumber}">
          {footnote.footnoteNumber}
        </td>

        <td><div class="text-container">{footnote.footnoteText}</div></td>
      </tr>
    {/each}
  </tbody>
</table>
