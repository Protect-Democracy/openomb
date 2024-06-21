<script lang="ts">
  // Helpful display that appears when no results are found

  // Props
  export let resultType: 'file' | 'account';

  const resultText = resultType == 'file' ? 'a file' : 'an account';
</script>

<svelte.fragment>
  <p>No {resultType}s were found from your criteria. Please refine your search and try again.</p>

  <dl>
    <dh>Need help finding {resultText}?</dh>
    <dd>
      Ensure separate keyword values are separated by commas (e.g. <i>navy,department of defense</i
      >).
    </dd>
    {#if resultType == 'file'}
      <dd>
        Try a keyword search on the <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.archives.gov/federal-register/laws/current.html">Public Law Number</a
        >.
      </dd>
      <dd>
        Ensure that all keywords are expected to be found within the file (search does not return
        partial matches).
      </dd>
      <dd>
        Read our <a target="_blank" href="/faq#faq-how-to-find-apportionments"
          >FAQ section on searching apportionments</a
        > for further guidance.
      </dd>
    {:else}
      <dd>Keywords must consist of full term(s), not abbreviations or acronyms.</dd>
    {/if}
  </dl>
</svelte.fragment>

<style>
  dl {
    color: var(--color-text-muted);
  }
  dh {
    font-weight: var(--font-copy-weight-bold);
  }
</style>
