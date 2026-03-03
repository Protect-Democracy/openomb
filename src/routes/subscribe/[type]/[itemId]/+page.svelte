<script lang="ts">
  import type { PageData } from './$types';
import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';

export let data: PageData;
$: ({ type, itemId, subscription, user } = data);
</script>

<div class="page-container content-container">
  {#if !user}
    <SubscribeLink subType={type} subItemId={itemId} />
  {:else if subscription}
    <h2>Successfully subscribed to {subscription.description}</h2>
    <p>
      You will now receive email updates when new files are approved for this {type}. You can manage
      the frequency of these, and other, notifications on the
      <a data-sveltekit-reload href="/subscribe">subscription page.</a>
    </p>
    <p>
      <a href={subscription.itemLink}>Go back to {subscription.description}</a>
    </p>
  {:else}
    <h2>There was an error subscribing to the {type}</h2>
  {/if}
</div>
