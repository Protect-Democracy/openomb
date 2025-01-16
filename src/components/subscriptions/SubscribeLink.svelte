<!--
  Subscribe Link

  If user is not logged in, shows login form instead, but still redirects to subscribe

  Params
    - user: currently logged in user
    - subType: the type of item the user is subscribing to (account, agency, etc)
    - subItemId: the id of the item the user is subscribing to
    - existingSubscription: subscription object for the current search (if one exists)
    - hideText: Hide the descriptive text next to the subscribe button
    - overrideFeatureFlag: show this component despite subscriptions being disabled within the config
        (used for testing!)
  Slots
    None
-->

<script lang="ts">
  import { deserialize } from '$app/forms';
  import Spinner from '$components/icons/Spinner.svelte';
  import LogIn from './LogIn.svelte';
  import { subscribeFeatureEnabled } from '$config/subscriptions';

  // Props
  export let user;
  export let subType;
  export let subItemId;
  export let existingSubscription;
  export let hideText = false;
  export let overrideFeatureFlag = false;

  let addedSubscription = existingSubscription;
  let loading = false;

  async function subscribe() {
    loading = true;

    const subResp = await fetch('/subscribe?/add', {
      method: 'POST',
      headers: {
        'x-sveltekit-action': 'true'
      },
      body: JSON.stringify({ type: subType, itemId: subItemId })
    });
    addedSubscription = deserialize(await subResp.text())?.data;
    loading = false;
  }

  async function unsubscribe() {
    loading = true;
    if (addedSubscription) {
      await fetch('/subscribe?/remove', {
        method: 'POST',
        headers: {
          'x-sveltekit-action': 'true'
        },
        body: JSON.stringify({ subId: addedSubscription.id })
      });
      addedSubscription = null;
    }
    loading = false;
  }
</script>

{#if overrideFeatureFlag || subscribeFeatureEnabled}
  <aside class="subscribe-action">
    {#if !hideText}
      {#if addedSubscription}
        <p class="muted">
          You are receiving email updates when new files are approved for this {subType}
        </p>
      {:else}
        <p class="muted">Receive email updates when new files are approved for this {subType}</p>
      {/if}
    {/if}
    {#if user}
      <div class="has-js-only-block">
        <button
          class="button compact"
          on:click={addedSubscription ? unsubscribe : subscribe}
          disabled={loading}
          title={addedSubscription
            ? `Unsubscribe from email updates for approved files`
            : `Subscribe to email updates for approved files`}
        >
          {#if loading}
            <span class="button-icon"><Spinner /></span>
          {/if}
          {addedSubscription ? 'Unsubscribe' : 'Subscribe'}
        </button>
      </div>

      <div class="no-js-only-block">
        {#if existingSubscription}
          <a class="button compact" href={`/subscribe/${subType}/${subItemId}/remove`}
            >Unsubscribe</a
          >
        {:else}
          <a class="button compact" href={`/subscribe/${subType}/${subItemId}`}>Subscribe</a>
        {/if}
      </div>
    {:else}
      <LogIn callbackUrl={`/subscribe/${subType}/${subItemId}`} action="Subscribe" />
    {/if}
  </aside>
{/if}

<style>
  .subscribe-action {
    display: flex;
    column-gap: var(--spacing);
    align-items: center;
    justify-content: flex-end;
  }

  .subscribe-action p {
    margin: 0;
    font-size: var(--font-size-slight);
  }

  @media (max-width: 768px) {
    .subscribe-action {
      flex-direction: column;
      row-gap: var(--spacing);
    }
  }
</style>
