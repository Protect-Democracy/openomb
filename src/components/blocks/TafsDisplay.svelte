<!--
  TAFS display

  Params
    - tafs: single TAFS record or array of TAFS
    - headerElement?: dom element to make primary header
    - subheaderElement?: dom element to make secondary header
    - groupByAccount: if true, we will group our tafs by account, id, fiscal year
          and display the iterations
    - hideAccountName?: if true, account name header(s) will not be displayed
          (the TAFS IDs will become the primary headers)
  Slots
    None
-->

<script lang="ts">
  import { groupBy, orderBy } from 'lodash-es';
  import { formatDate, formatFileTitle, formatTafsFormattedId } from '$lib/formatters';

  export let tafs;
  export let headerElement = 'h3';
  export let subheaderElement = 'h4';
  export let groupByAccount = false;
  export let hideAccountName = false;

  const tafsArray = Array.isArray(tafs) ? tafs : [tafs];
</script>

<div class="tafs-block">
  <!-- If grouping by account, display Account > TAFS Id > Fiscal Year > Iteration -->
  {#if groupByAccount}
    {@const tafsByAccount = groupBy(
      tafsArray,
      (t) => `${t.budgetAgencyTitleId}/${t.budgetBureauTitleId}/${t.accountTitleId}`
    )}
    {#each Object.keys(tafsByAccount) as accountId}
      {@const tafsById = groupBy(tafsByAccount[accountId], (t) => t.tafsId)}
      {#if !hideAccountName}
        <svelte:element this={headerElement} class="tafs-title">
          {tafsByAccount[accountId][0].accountTitle}
        </svelte:element>
      {/if}
      {#each Object.keys(tafsById) as tafsId}
        {@const tafsByYear = groupBy(tafsById[tafsId], (t) => t.fiscalYear)}
        <div class="tafs-entry">
          <svelte:element
            this={hideAccountName ? headerElement : subheaderElement}
            class="tafs-title"
          >
            TAFS {formatTafsFormattedId(tafsById[tafsId][0])}
          </svelte:element>
          {#each Object.keys(tafsByYear) as fiscalYear}
            <div class="tafs-files">
              <div class="fiscal-year">
                FY {fiscalYear}
              </div>
              <div class="iterations">
                {#each orderBy(tafsByYear[fiscalYear], 'iteration', 'asc') as tafIteration}
                  <div>
                    <a href={`/file/${tafIteration.fileId}#tafs_${tafIteration.tafsTableId}`}
                      >Iteration {tafIteration.iteration}</a
                    >
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    {/each}
  {:else}
    {#each tafsArray as tafsEntry}
      <div class="tafs-entry">
        <!-- If we aren't grouping by account, display full details -->
        <svelte:element this={headerElement} class="tafs-title">
          <a href={`/file/${tafsEntry.fileId}#tafs_${tafsEntry.tafsTableId}`}
            >{tafsEntry.accountTitle}</a
          >
        </svelte:element>
        <svelte:element this={subheaderElement} class="tafs-subtitle">
          TAFS {formatTafsFormattedId(tafsEntry)}
        </svelte:element>
        <div class="tags">
          <span class="tag">FY {tafsEntry.fiscalYear}</span>
          <span class="tag">Iteration {tafsEntry.iteration}</span>
        </div>
        {#if tafsEntry.file}
          <div class="approval">
            Approved {formatDate(tafsEntry.file.approvalTimestamp, 'long')}
          </div>
        {/if}
        <div class="agency-bureau">
          {tafsEntry.budgetAgencyTitle} &middot; {tafsEntry.budgetBureauTitle}
        </div>
        <div class="apportionment">
          Apportionment:
          <a href={`/file/${tafsEntry.fileId}`}
            >{tafsEntry.file ? formatFileTitle(tafsEntry.file) : tafsEntry.fileId}</a
          >
        </div>
      </div>
    {/each}
  {/if}
</div>

<style>
  .tafs-entry {
    margin: var(--spacing-double) 0;
    border-bottom: 1px solid var(--color-gray-light);
    padding-bottom: var(--spacing-double);
  }

  .tafs-files {
    display: flex;
    column-gap: var(--spacing);
    flex-align-items: top;
    margin: var(--spacing-half) var(--spacing-double) 0;
  }

  .fiscal-year {
    font-weight: 700;
    flex-shrink: 0;
  }

  .iterations {
    display: flex;
    flex-wrap: wrap;
    column-gap: var(--spacing);
  }

  .tafs-title,
  .tafs-subtitle {
    margin: 0 0 var(--spacing-half);
    padding: 0;
  }

  .tag {
    padding: var(--spacing-small) var(--spacing-half);
    border: 1px solid var(--color-gray-lighter);
    display: inline-block;
  }

  .tags {
    margin: var(--spacing-half) 0;
  }

  .agency-bureau {
    font-weight: 700;
  }
</style>
