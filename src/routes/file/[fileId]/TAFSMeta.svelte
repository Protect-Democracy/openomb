<script lang="ts">
  import { resolve } from '$app/paths';
  import { formatDate } from '$lib/formatters';
  import type { FileDetailsTafs } from '$queries/files';

  // Props
  export let tafsGroup: FileDetailsTafs;
</script>

<div class="tafs-meta grid-values">
  <div class="iterations grid-value">
    <strong id="tafs_{tafsGroup.tafsTableId}_iterations_label"
      >Iterations<span class="sr-only">:</span></strong
    >

    <ul aria-labelledby="tafs_{tafsGroup.tafsTableId}_iterations_label">
      {#each tafsGroup.iterations as iteration (iteration.tafsTableId)}
        <li>
          {#if iteration.iteration === tafsGroup.iteration}
            <span
              >{iteration.iteration}: {formatDate(iteration.approvalTimestamp, 'short')}
              (this iteration)</span
            >
          {:else if iteration.fileId}
            <a
              href={resolve(`/file/[fileId]#tafs_${iteration.tafsTableId}`, {
                fileId: iteration.fileId
              })}
              title="Go to file wih this iteration"
            >
              {iteration.iteration}: {formatDate(iteration.approvalTimestamp, 'short')}</a
            >
          {:else}
            <span>{iteration.iteration}: {formatDate(iteration.approvalTimestamp, 'short')}</span>
          {/if}
        </li>
      {/each}
    </ul>
  </div>

  <div class="grid-value">
    <strong>Adjustment authority<span class="sr-only">:</span></strong>
    <span>{tafsGroup.adjAut ? 'Yes' : 'No'}</span>
  </div>

  <div class="grid-value">
    <strong>Reporting categories<span class="sr-only">:</span></strong>
    <span>{tafsGroup.rptCat ? 'Yes' : 'No'}</span>
  </div>

  <div class="grid-value">
    <strong>Bureau<span class="sr-only">:</span></strong>
    <span>
      {#if tafsGroup.budgetAgencyTitleId && tafsGroup.budgetBureauTitleId}
        <a
          href={resolve('/agency/[agencyId]/bureau/[bureauId]', {
            agencyId: tafsGroup.budgetAgencyTitleId,
            bureauId: tafsGroup.budgetBureauTitleId
          })}
          title="Go to bureau">{tafsGroup.budgetBureauTitle}</a
        >
      {:else}
        {tafsGroup.budgetBureauTitle}
      {/if}
    </span>
  </div>

  <div class="grid-value">
    <strong>Account<span class="sr-only">:</span></strong>
    <span>
      {#if tafsGroup.budgetAgencyTitleId && tafsGroup.budgetBureauTitleId && tafsGroup.accountTitleId}
        <a
          href={resolve('/agency/[agencyId]/bureau/[bureauId]/account/[accountId]', {
            agencyId: tafsGroup.budgetAgencyTitleId,
            bureauId: tafsGroup.budgetBureauTitleId,
            accountId: tafsGroup.accountTitleId
          })}
          title="Go to bureau">{tafsGroup.accountTitle}</a
        >
      {:else}
        {tafsGroup.accountTitle}
      {/if}
    </span>
  </div>
</div>

<style>
  .grid-values {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    column-gap: var(--spacing-double);
    row-gap: var(--spacing);
    margin: 0;
    padding: 0;
    list-style: none;

    @media (max-width: 1000px) {
      & {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }

    @media (max-width: 300px) {
      & {
        grid-template-columns: 1fr 1fr;
      }
    }
  }

  .grid-value {
    margin: 0;
    padding: var(--spacing-half) 0 var(--spacing) 0;
    border-top: var(--border-weight) solid var(--color-gray-dark);

    strong {
      display: block;
      font-size: var(--font-size-small);
    }
  }

  .tafs-meta {
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    margin-bottom: 0;
    /* TODO: We want these to line up with the file grid values in size */
    margin-right: calc(var(--spacing) * 8);

    @media (max-width: 1000px) {
      & {
        margin-right: 0;
      }
    }

    @media (max-width: 600px) {
      & {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
  }

  .tafs-meta .grid-value {
    border-color: var(--color-gray-light);
    border-width: var(--border-weight-thin);
    font-size: var(--font-size-small);
    line-height: var(--line-height);
  }

  .iterations ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
