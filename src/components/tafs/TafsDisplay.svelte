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
  import { formatDate, formatFileTitle } from '$lib/formatters';

  export let tafs;
  export let headerElement = 'h3';
  export let subheaderElement = 'h4';
  export let groupByAccount = false;
  export let hideAccountHeader = false;
  export let groupByFile = false;
  export let hideFileHeader = false;

  $: tafsArray = Array.isArray(tafs) ? tafs : [tafs];
</script>

<div class="tafs-block">
  <!-- If grouping by account, display Account > TAFS Id > Fiscal Year > Iteration -->
  {#if groupByAccount}
    {@const tafsByAccount = groupBy(
      tafsArray,
      (t) => `${t.budgetAgencyTitleId}/${t.budgetBureauTitleId}/${t.accountTitleId}`
    )}

    {#each Object.keys(tafsByAccount) as accountId (accountId)}
      {@const tafsById = groupBy(tafsByAccount[accountId], (t) => t.tafsId)}
      <div class:tafs-group={!hideAccountHeader}>
        {#if !hideAccountHeader}
          <svelte:element this={headerElement} class="tafs-title">
            {tafsByAccount[accountId][0].accountTitle}
          </svelte:element>
        {/if}
        {#each Object.keys(tafsById) as tafsId (tafsId)}
          {@const tafsByYear = groupBy(tafsById[tafsId], (t) => t.fiscalYear)}
          <div class="tafs-entry">
            <svelte:element
              this={hideAccountHeader ? headerElement : subheaderElement}
              class="tafs-title"
            >
              TAFS {tafsById[tafsId][0].tafsIdFormatted}
            </svelte:element>

            {#each Object.keys(tafsByYear) as fiscalYear (fiscalYear)}
              <dl class="iterations">
                <dh>FY {fiscalYear} Iterations</dh>
                {#each orderBy(tafsByYear[fiscalYear], 'iteration', 'asc') as tafIteration (tafIteration.tafsTableId)}
                  <dd>
                    <a href={`/file/${tafIteration.fileId}#tafs_${tafIteration.tafsTableId}`}
                      >{tafIteration.iteration}: {formatDate(tafIteration.approvalTimestamp)}</a
                    >
                  </dd>
                {/each}
              </dl>
            {/each}
          </div>
        {/each}
      </div>
    {/each}
    <!-- If grouping by file, display File > TAFS -->
  {:else if groupByFile}
    {@const tafsByFile = groupBy(tafsArray, (t) => t.fileId)}
    {#each Object.keys(tafsByFile) as fileId (fileId)}
      <div class:tafs-group={!hideFileHeader}>
        {#if !hideFileHeader}
          <svelte:element this={headerElement} class="tafs-title">
            <a href={`/file/${fileId}`}>
              {tafsByFile[fileId][0].file ? formatFileTitle(tafsByFile[fileId][0].file) : fileId}
            </a>
          </svelte:element>
        {/if}
        {#each tafsByFile[fileId] as tafsEntry (tafsEntry.tafsTableId)}
          <div class="tafs-entry">
            <!-- If we aren't grouping by account, display full details -->
            <svelte:element
              this={hideFileHeader ? headerElement : subheaderElement}
              class="tafs-title"
            >
              <a href={`/file/${tafsEntry.fileId}#tafs_${tafsEntry.tafsTableId}`}
                >{tafsEntry.accountTitle}</a
              >
            </svelte:element>
            <svelte:element this={hideFileHeader ? subheaderElement : 'div'} class="tafs-subtitle">
              TAFS {tafsEntry.tafsIdFormatted}
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
            {#if hideFileHeader}
              <div class="apportionment">
                Apportionment:
                <a href={`/file/${tafsEntry.fileId}`}
                  >{tafsEntry.file ? formatFileTitle(tafsEntry.file) : tafsEntry.fileId}</a
                >
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  {:else}
    {#each tafsArray as tafsEntry (tafsEntry.tafsTableId)}
      <article class="tafs-entry">
        <!-- If we aren't grouping by account, display full details -->
        <svelte:element this={headerElement} class="tafs-title">
          <a href={`/file/${tafsEntry.fileId}#tafs_${tafsEntry.tafsTableId}`}
            >{tafsEntry.accountTitle}</a
          >
        </svelte:element>
        <svelte:element this={subheaderElement} class="tafs-subtitle">
          TAFS {tafsEntry.tafsIdFormatted}
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
      </article>
    {/each}
  {/if}
</div>

<style>
  .tafs-group,
  .tafs-entry:not(.tafs-group .tafs-entry) {
    margin: var(--spacing-double) 0;
    border-bottom: 1px solid var(--color-gray-light);
    padding-bottom: var(--spacing-double);
  }

  .tafs-group .tafs-entry {
    margin: var(--spacing-double) var(--spacing) 0;
  }

  .iterations {
    margin: 0;
  }

  .iterations dh {
    font-weight: var(--font-copy-weight-bold);
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
