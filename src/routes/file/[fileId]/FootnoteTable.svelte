<script lang="ts">
  import { uniqBy } from 'lodash-es';

  // Props
  export let footnotes;
  export let idPrefix: string = 'footnote';

  // Derived
  $: hasMultipleFiles = footnotes && footnotes.length > 1 && uniqBy(footnotes, 'fileId').length > 1;
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
    {#each footnotes as footnote}
      <tr>
        {#if hasMultipleFiles}
          <td><a href={`/file/${footnote.fileId}`}>{footnote.fileId}</a></td>
        {/if}

        <td id="{idPrefix}__{footnote.footnoteNumber}">
          {footnote.footnoteNumber}
        </td>

        <td><div class="text-container">{footnote.footnoteText}</div></td>
      </tr>
    {/each}
  </tbody>
</table>
