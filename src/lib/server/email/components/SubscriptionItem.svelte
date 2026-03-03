<script lang="ts">
  import { DateTime } from 'luxon';
  import { deployedBaseUrl } from '$config/index';
  import { maxFilesPerNotificationEntry } from '$config/subscriptions';
  import { formatFileTitle, formatDate, formatNumber } from '$lib/formatters';

  // TODO: This type should be defined somewhere
  import type { SubscriptionWithFiles } from '$server/subscriptions';
  import type { SubscriptionDetails } from '$db/queries/subscriptions';

  export let subscription: SubscriptionWithFiles & SubscriptionDetails;

  $: searchParams = new URLSearchParams({
    ...subscription.criterion,
    agencyBureau: `${subscription.criterion.agency}${subscription.criterion.bureau && ','}${subscription.criterion.bureau}`,
    createdStart: DateTime.fromJSDate(subscription.criterion.createdStart).toISODate()
  });
  $: searchParams.delete('agency');
  $: searchParams.delete('bureau');
</script>

<div>
  <p style="font-weight: bold;">
    <a href={`${deployedBaseUrl}${subscription.itemLink}`} target="_blank"
      >{subscription.description}</a
    >: {formatNumber(subscription.fileCount)}
    approved apportionments
  </p>

  <ul style="padding-left: 1.5rem;">
    {#each subscription.files as file}
      <li>
        {formatDate(file.approvalTimestamp, 'medium')}:
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
