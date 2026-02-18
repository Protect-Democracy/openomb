<script lang="ts">
  import SubscriptionItem from './SubscriptionItem.svelte';
import { subscriptionTypeTitles } from '$config/subscriptions';

export let type = '';
export let subscriptionGroup = [];

// Derived
$: title = subscriptionTypeTitles[type];
</script>

<div>
  <h3>{title}</h3>

  {#each subscriptionGroup as subscription}
    <div>
      <SubscriptionItem {subscription} />
    </div>
  {/each}
</div>
