<script lang="ts">
  import { resolve } from '$app/paths';
  import type { tafsDetails } from '$schema/tafs';
  import { formatTafsFormattedId, formatDateISO, formatDate } from '$lib/formatters';

  // Props
  export let tafs: tafsDetails;
  export let headingElement = 'h3';

  // Derived
  $: fileId = tafs.fileId;
  $: hasFile = !!tafs.file;
  $: file = hasFile ? tafs.file : null;
</script>

<article class="tafs-display-item">
  <svelte:element this={headingElement} class="heading">
    {#if fileId}
      <a href={resolve(`/file/[fileId]#tafs_${tafs.tafsTableId}`, { fileId })}>
        {tafs.accountTitle}
      </a>
    {:else}
      {tafs.accountTitle}
    {/if}
  </svelte:element>

  <div>
    <ul class="inline-list ids">
      <li>
        <acronym title="Treasury Appropriation Fund Symbol">TAFS</acronym>
        {formatTafsFormattedId(tafs)}
      </li>
      <li>File {fileId}</li>
    </ul>
  </div>

  <div>
    <ul class="inline-list fy-iteration">
      <li><span class="tag"><acronym title="Fiscal Year">FY</acronym> {tafs.fiscalYear}</span></li>
      <li><span class="tag">Iteration {tafs.iteration}</span></li>
    </ul>
  </div>

  <p class="approval-date">
    Approved
    <time datetime={formatDateISO(file?.approvalTimestamp)}>
      {formatDate(file?.approvalTimestamp, 'medium')}
    </time>
  </p>

  <ul class="inline-list heirarchy">
    <li>
      {#if tafs.budgetAgencyTitleId}
        <a
          class="like-text"
          title="Go to agency: {tafs.budgetAgencyTitle}"
          href={resolve('/agency/[agencyId]', { agencyId: tafs.budgetAgencyTitleId })}
        >
          {tafs.budgetAgencyTitle}
        </a>
      {:else}
        {tafs.budgetAgencyTitle}
      {/if}
    </li>

    <li>
      {#if tafs.budgetAgencyTitleId && tafs.budgetBureauTitleId}
        <a
          class="like-text"
          title="Go to bureau: {tafs.budgetBureauTitle}"
          href={resolve('/agency/[agencyId]/bureau/[bureauId]', {
            agencyId: tafs.budgetAgencyTitleId,
            bureauId: tafs.budgetBureauTitleId
          })}
        >
          {tafs.budgetBureauTitle}
        </a>
      {:else}
        {tafs.budgetBureauTitle}
      {/if}
    </li>
  </ul>
</article>

<style>
  .tafs-display-item {
    border-bottom: var(--border-weight-thin) solid var(--color-gray-light);
    padding-bottom: var(--spacing-double);
    margin-bottom: var(--spacing-double);
  }

  .heading {
    margin-bottom: 0;
  }

  .ids {
    display: block;
    font-weight: var(--font-copy-weight-bold);
    margin-bottom: var(--spacing-half);
  }

  .fy-iteration {
    display: block;

    li::before {
      content: '';
      padding: 0;
      margin: 0;
    }
  }

  .approval-date {
    margin-bottom: 0;
  }
</style>
