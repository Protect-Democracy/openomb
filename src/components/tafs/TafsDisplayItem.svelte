<script lang="ts">
  import type { tafsDetails } from '$db/schema/tafs';
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
    <a href={`/file/${fileId}/#tafs_${tafs.tafsTableId}`}>
      {tafs.accountTitle}
    </a>
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
      <a
        class="like-text"
        title="Go to agency: {tafs.budgetAgencyTitle}"
        href="/agency/{tafs.budgetAgencyTitleId}"
      >
        {tafs.budgetAgencyTitle}
      </a>
    </li>

    <li>
      <a
        class="like-text"
        title="Go to bureau: {tafs.budgetBureauTitle}"
        href="/agency/{tafs.budgetAgencyTitleId}/bureau/{tafs.budgetBureauTitleId}"
      >
        {tafs.budgetBureauTitle}
      </a>
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
