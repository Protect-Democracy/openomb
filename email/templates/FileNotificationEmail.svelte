<script lang="ts">
  import { groupBy, sortBy } from 'lodash-es';
  import Wrapper from '../components/Wrapper.svelte';
  import SubscriptionGroup from '../components/SubscriptionGroup.svelte';
  import { subscriptionTypes } from '../../src/config/subscriptions';

  export let title: string = 'New Apportionment Approvals';
  export let subscriptions = [];

  // Derived
  $: subscriptionGroups = groupBy(
    sortBy(subscriptions, (s) => subscriptionTypes.indexOf(s.type)),
    'type'
  );
</script>

<Wrapper {title} unsubscribable={true}>
  <p>
    New apportionment files have been approved within your subscriptions. These files are listed
    below.
  </p>

  <div>
    {#each Object.entries(subscriptionGroups) as [type, subscriptionGroup]}
      <SubscriptionGroup {type} {subscriptionGroup} />
    {/each}
  </div>
</Wrapper>
