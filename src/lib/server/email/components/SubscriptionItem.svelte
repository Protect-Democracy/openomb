<script lang="ts">
  import { deployedBaseUrl } from '$config/index';
  import { maxFilesPerNotificationEntry } from '$config/subscriptions';
  import { formatFileTitle, formatDate, formatNumber } from '$lib/formatters';
  import { criterionToUrlSearchParams } from '$lib/searches';

  // TODO: This type should be defined somewhere
  import type { SubscriptionWithFiles } from '$server/subscriptions';

  export let subscription: SubscriptionWithFiles;

  $: searchParams = criterionToUrlSearchParams({
    ...subscription.criterion
  });
  $: searchParams.set(
    'createdStart',
    subscription.criterion.createdStart
      ? formatDate(subscription.criterion.createdStart, 'iso-date')
      : ''
  );
</script>

<div>
  <p style="font-weight: bold;">
    <a href={`${deployedBaseUrl}${subscription.itemLink}`} target="_blank"
      >{subscription.description}</a
    >: {formatNumber(subscription.fileCount)}
    approved apportionments
  </p>

  <ul style="padding-left: 1.5rem;">
    {#each subscription.files as file (file.fileId)}
      <li>
        {#if file.approvalTimestamp}
          {formatDate(file.approvalTimestamp, 'medium')}:
        {:else}
          {formatDate(file.createdAt, 'medium')}:
        {/if}
        <a href={`${deployedBaseUrl}/file/${file.fileId}`} target="_blank"
          >{formatFileTitle(file)}</a
        >
      </li>
    {/each}

    {#if subscription.fileCount > maxFilesPerNotificationEntry}
      <li>
        ... and {formatNumber(subscription.fileCount - maxFilesPerNotificationEntry)} more (<a
          href={`${deployedBaseUrl}/search?${searchParams.toString()}`}>View All</a
        >)
      </li>
    {/if}
  </ul>
</div>
