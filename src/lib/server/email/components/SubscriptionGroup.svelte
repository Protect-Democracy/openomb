<script lang="ts">
  import SubscriptionItem from './SubscriptionItem.svelte';
import { subscriptionTypeTitles } from '$config/subscriptions';

// TODO: This type should be defined somewhere
import type { SubscriptionWithFiles } from '$server/subscriptions';
import type { SubscriptionDetails } from '$db/queries/subscriptions';

export let type: keyof typeof subscriptionTypeTitles;
export let subscriptionGroup: (SubscriptionWithFiles & SubscriptionDetails)[] = [];

// Derived
$: title = type && type in subscriptionTypeTitles ? subscriptionTypeTitles[type] : '';
</script>

<div>
  <h3>{title}</h3>

  {#each subscriptionGroup as subscription}
    <div>
      <SubscriptionItem {subscription} />
    </div>
  {/each}
</div>
