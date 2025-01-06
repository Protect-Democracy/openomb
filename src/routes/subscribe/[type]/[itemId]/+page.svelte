<script lang="ts">
  import type { PageData } from './$types';
  import { formatNumber } from '$lib/formatters';
  import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';

  export let data: PageData;
  $: ({ type, itemId, subscription, user } = data);
</script>

<div class="page-container content-container">
  {#if !user}
    <SubscribeLink subType={type} subItemId={itemId} />
  {:else if subscription}
    <h2>Successfully subscribed to {type}</h2>
    <p>
      <a href={subscription.itemLink}>Go to {subscription.itemDetails?.name || 'search'}</a>
    </p>
  {:else}
    <h2>There was an error subscribing to the {type}</h2>
  {/if}
</div>
