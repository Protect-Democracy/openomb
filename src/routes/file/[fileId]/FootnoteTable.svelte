<script lang="ts">
  // Props
  export let footnotes;
  export let idPrefix: string = 'footnote';
</script>

<table class="font-small">
  <thead>
    <tr><th>Number</th><th>Text</th></tr>
  </thead>

  <tbody>
    {#each footnotes as footnote}
      <tr>
        <td id="{idPrefix}__{footnote.footnoteNumber}">{footnote.footnoteNumber}</td>
        <td><div class="text-container">{footnote.footnoteText}</div></td>
      </tr>
    {/each}
  </tbody>
</table>
