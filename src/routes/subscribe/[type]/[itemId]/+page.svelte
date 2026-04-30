<script lang="ts">
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';
  import SubscribeLink from '$components/subscriptions/SubscribeLink.svelte';
  import Check from '$components/icons/Check.svelte';
  import ArrowLeft from '$components/icons/ArrowLeft.svelte';
  import XSymbol from '$components/icons/XSymbol.svelte';

  export let data: PageData;
  $: ({ type, itemId, subscription, user } = data);
</script>

<div class="page-message-container">
  <div class="message-box">
    {#if !user}
      <h1>Login to Subscribe</h1>
      <SubscribeLink subType={type} subItemId={itemId} {user} />
    {:else if subscription}
      <div class="highlight-icon"><Check /></div>

      <h1>You are subscribed</h1>

      <p>
        You will receive email updates when new files are approved for <strong
          >{subscription.description}</strong
        >. Go to your <a href={resolve('/subscribe')}>account page</a> to view all your subscriptions
        and manage the frequency of email updates.
      </p>

      <a class="alt subscription-link" href={resolve(subscription.itemLink)}
        ><span class="inline-icon"><ArrowLeft /></span>&nbsp;Go back to {subscription.description}</a
      >
    {:else}
      <div class="highlight-icon error"><XSymbol /></div>
      <p>There was an error subscribing to the <strong>{type}</strong> type.</p>
    {/if}
  </div>
</div>

<style>
  .message-box {
    text-align: center;
  }

  .highlight-icon {
    font-size: calc(var(--spacing) * 4);
    padding: 0.25em;
  }

  .subscription-link {
    display: block;
    margin-top: calc(var(--spacing) * 3);
    font-weight: bold;
  }
</style>
