<script lang="ts">
  // Helpful display that appears when no results are found

  // Props
  export let resultType: 'file' | 'account';
</script>

<p>
  <strong>No {resultType}s were found</strong> from your criteria. Please refine your search and try again.
  Need some tips?
</p>

<ul>
  <li>
    Ensure separate keyword values are separated by commas (e.g. <em>navy, department of defense</em
    >).
  </li>

  {#if resultType == 'file'}
    <li>
      Try a keyword search on the <a
        target="_blank"
        rel="noopener noreferrer"
        href="https://www.archives.gov/federal-register/laws/current.html">Public Law Number</a
      >.
    </li>

    <li>
      Ensure that all keywords are expected to be found within the file (search does not return
      partial matches).
    </li>

    <li>
      Read our <a target="_blank" href="/faq#faq-how-to-find-apportionments"
        >FAQ section on searching apportionments</a
      > for further guidance.
    </li>
  {:else}
    <li>Keywords must consist of full term(s), not abbreviations or acronyms.</li>
  {/if}
</ul>
