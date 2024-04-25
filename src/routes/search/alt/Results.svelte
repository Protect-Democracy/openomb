<script lang="ts">
  export let results = [];
  import { formatDate, formatFileTitle, formatTafsFormattedId } from '$lib/formatters';
</script>

{#if results.length}
  {#each results as result}
    <div class="result">
      <h3>
        <a
          href={`/agency/${result.filtered_tafs.budgetAgencyTitleId}/bureau/${result.filtered_tafs.budgetBureauTitleId}/account/${result.filtered_tafs.accountTitleId}`}
        >
          {result.filtered_tafs.accountTitle}
        </a>
      </h3>
      <h4>
        TAFS <a
          href={`/file/${result.filtered_files.fileId}#tafs_${result.filtered_tafs.tafsTableId}`}
          >{formatTafsFormattedId(result.filtered_tafs)}</a
        >
      </h4>
      <div class="tags">
        <span class="tag">FY {result.filtered_files.fiscalYear}</span>
        <span class="tag">Iteration {result.filtered_tafs.iteration}</span>
      </div>
      <p>
        Approved {formatDate(result.filtered_files.approvalTimestamp, 'long')}<br />
        <a href={`/agency/${result.filtered_tafs.budgetAgencyTitleId}`}
          >{result.filtered_tafs.budgetAgencyTitle}</a
        >
        &middot;
        <a
          href={`/agency/${result.filtered_tafs.budgetAgencyTitleId}/bureau/${result.filtered_tafs.budgetBureauTitleId}`}
          >{result.filtered_tafs.budgetBureauTitle}</a
        ><br />
        Apportionment:
        <a href={`/file/${result.filtered_files.fileId}`}
          >{formatFileTitle(result.filtered_files)}</a
        >
      </p>
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
</style>
