<script lang="ts">
  export let results = [];
  import { formatDate, formatFileTitle, formatTafsFormattedId } from '$lib/formatters';
</script>

{#if results.length}
  {#each results as result}
    <div class="result">
      <h3><a href={`/file/${result.fileId}`}>{formatFileTitle(result)}</a></h3>
      <div class="tags">
        <span class="tag">FY {result.fiscalYear}</span>
      </div>
      <p>
        Approved {formatDate(result.approvalTimestamp, 'long')}
      </p>

      {#each result.tafs as tafs}
        <div class="result-taf">
          <h4>
            TAFS <a href={`/file/${result.fileId}#tafs_${tafs.tafsTableId}`}
              >{formatTafsFormattedId(tafs)}</a
            >
          </h4>
          <div class="tags">
            <span class="tag">Iteration {tafs.iteration}</span>
          </div>
          <p>
            <strong
              ><a
                href={`/agency/${tafs.budgetAgencyTitleId}/bureau/${tafs.budgetBureauTitleId}/account/${tafs.accountTitleId}`}
                >{tafs.accountTitle}</a
              ></strong
            ><br />
            <strong>
              <a href={`/agency/${tafs.budgetAgencyTitleId}`}>{tafs.budgetAgencyTitle}</a> &middot;
              <a href={`/agency/${tafs.budgetAgencyTitleId}/bureau/${tafs.budgetBureauTitleId}`}
                >{tafs.budgetBureauTitle}</a
              >
            </strong>
          </p>
        </div>
      {/each}
    </div>
  {/each}
{:else}
  <p>No Results</p>
{/if}

<style>
  .result {
    margin: var(--spacing-double) 0;
    border-bottom: 1px solid var(--color-gray-light);
    padding-bottom: var(--spacing-double);
  }

  .result h3,
  h4 {
    margin: 0 0 var(--spacing-half);
    padding: 0;
  }

  .result .tag {
    border: 1px solid var(--color-gray-light);
    padding: var(--spacing-small) var(--spacing-half);
    border-radius: var(--border-radius);
    display: inline-block;
  }

  .result .tags {
    margin: var(--spacing-half) 0;
  }

  .result p {
    margin: 0;
  }

  .result-taf {
    margin-top: var(--spacing);
  }
</style>
