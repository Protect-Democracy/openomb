<script lang="ts">
  import { DateTime } from 'luxon';
  import { Text } from '@sveltelaunch/svelte-5-email';
  import { deployedBaseUrl } from '../../src/config/index';
  import { maxFilesPerNotificationEntry } from '../../src/config/subscriptions';
  import { formatFileTitle, formatDate } from '../../src/lib/formatters';

  export let subscription = {};
</script>

<div>
  <Text style={{ fontWeight: 'bold', fontSize: undefined }}>
    <a href={`${deployedBaseUrl}${subscription.itemLink}`} target="_blank"
      >{subscription.description}</a
    >: {subscription.fileCount}
    approved apportionments
  </Text>

  <ul>
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
        ... and {subscription.fileCount - maxFilesPerNotificationEntry} more (<a
          href={`${deployedBaseUrl}/search?${new URLSearchParams({
            ...subscription.criterion,
            approvedStart: DateTime.fromJSDate(subscription.criterion.approvedStart).toISODate()
          }).toString()}`}>View All</a
        >)
      </li>
    {/if}
  </ul>
</div>

<style>
  ul {
    padding-left: 1.5rem;
  }
</style>
