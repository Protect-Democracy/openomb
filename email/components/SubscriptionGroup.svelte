<script lang="ts">
  import { Heading } from '@sveltelaunch/svelte-5-email';
  import SubscriptionItem from './SubscriptionItem.svelte';
  import { subscriptionTypeTitles } from '../../src/config/subscriptions';

  export let type = '';
  export let subscriptionGroup = [];

  // Derived
  $: title = subscriptionTypeTitles[type];
</script>

<div>
  <Heading as="h3">{title}</Heading>

  {#each subscriptionGroup as subscription}
    <div>
      <SubscriptionItem {subscription} />
    </div>
  {/each}
</div>
