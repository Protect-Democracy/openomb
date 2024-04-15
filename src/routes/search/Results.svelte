<script lang="ts">
  export let results = [];
</script>

{#if results.length}
  {#each results as result}
    <div class="result">
      <h3><a href={`/file/${result.fileId}`}>{result.fileName}</a></h3>
        <p>
          <strong>Approved By:</strong> {result.approverTitle}<br>
          <strong>Approval Date:</strong> {result.approvalTimestamp}
        </p>

      {#if result.tafs?.length}
        <h4>Matching Accounts</h4>

        {#each result.tafs as tafs}
          <p>
            <strong>Budget Agency Title:</strong> <a href={`/agency/${tafs.budgetAgencyTitleId}`}>{tafs.budgetAgencyTitle}</a><br>
            <strong>Budget Bureau Title:</strong> <a href={`/agency/${tafs.budgetAgencyTitleId}/bureau/${tafs.budgetBureauTitleId}`}>{tafs.budgetBureauTitle}</a><br>
            <strong>TAFS:</strong> {tafs.tafsId}<br>
            <strong>Account Title:</strong> <a href={`/agency/${tafs.budgetAgencyTitleId}/bureau/${tafs.budgetBureauTitleId}/account/${tafs.accountTitleId}`}>{tafs.accountTitle}</a>
          </p>

          {#if tafs.lines?.length}
            <h5>Relevant Lines</h5>
            <table>
              <thead>
                <tr>
                  <td>Line Number</td>
                  <td>Line Description</td>
                  <td>Footnotes</td>
                </tr>
              </thead>
              <tbody>
                {#each tafs.lines as line}
                  <tr>
                    <td>{line.lineNumber}</td>
                    <td>{line.lineDescription}</td>
                    <td>
                      {#each line.footnotes as lineFootnote}
                        <span title={lineFootnote.footnoteText}>{lineFootnote.footnoteNumber}</span>,{' '}
                      {/each}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        {/each}
      {/if}
    </div>
  {/each}
{:else}
  <p>No Results</p>
{/if}

<style>
  .result {
    margin: var(--spacing) 0;
    padding: var(--spacing);
    border: 1px solid var(--color-gray-medium);
  }
</style>
