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
  import { onMount } from 'svelte';
  import { deserialize } from '$app/forms';
  import Spinner from '$components/icons/Spinner.svelte';
  import LogIn from './LogIn.svelte';
  import { subscribeFeatureEnabled, sessionCookieName } from '$config/subscriptions';
  import { clientGetUser, clientGetSubscriptionById } from '$lib/users';
  import { cookieHasValue } from '$lib/utilities';

  import type { User } from '$lib/users';

  // Props
  export let user: User;
  export let variant: 'small' | 'full' | null = 'full';
  export let subType: 'folder' | 'account' | 'agency' | 'bureau' | 'search' | 'file' | 'tafs';
  export let subItemId: string | null;
  export let subItemFormatted: string | null;
  export let existingSubscription;
  export let hideText = false;
  export let overrideFeatureFlag = false;

  let addedSubscription = existingSubscription;
  let loading = false;

  onMount(async () => {
    // To be able to keep general routes able to use browser caching, we
    // utilize some client side JS to fetch the user data.  Ideally,
    // we could have SvelteKit just make this component client only, but
    // unsure if there is a way to do that.
    if (cookieHasValue(sessionCookieName)) {
      user = user || (await clientGetUser());
      addedSubscription =
        addedSubscription || (await clientGetSubscriptionById(subType, subItemId));
    }
  });

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

{#if overrideFeatureFlag || subscribeFeatureEnabled || user}
  <aside class:variant-small={variant === 'small'}>
    <div class="subscribe-action">
      {#if !hideText}
        <p class:font-small={variant === 'small'}>
          {#if addedSubscription}
            You are subscribed to receive email updates when new files are approved for <em
              >{subItemFormatted || `this ${subType}`}</em
            >.
          {:else}
            Receive email updates when new files are approved for <em
              >{subItemFormatted || `this ${subType}`}</em
            >. <br />
            <small
              >By logging in or subscribing to updates, you agree to the
              <a href="/privacy-policy">OpenOMB privacy policy</a>.</small
            >
          {/if}
        </p>
      {/if}

      {#if user}
        <div class="user-actions">
          <div class="has-js-only-block">
            <button
              class="button compact subscribe"
              class:small={variant === 'small'}
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
              <a
                class="button compact subscribe"
                class:small={variant === 'small'}
                href={`/subscribe/${subType}/${subItemId}/remove`}>Unsubscribe</a
              >
            {:else}
              <a class="button compact subscribe" href={`/subscribe/${subType}/${subItemId}`}
                >Subscribe</a
              >
            {/if}
          </div>

          <div class="manage-subscriptions">
            <a href="/subscribe" class="subscribe font-small">Manage all subscriptions</a>
          </div>
        </div>
      {:else}
        <LogIn {variant} callbackUrl={`/subscribe/${subType}/${subItemId}`} action="Subscribe" />
      {/if}
    </div>
  </aside>
{/if}

<style>
  aside {
    background-color: var(--color-subscribe-background);
    padding: var(--spacing);
    margin-bottom: var(--spacing);
  }

  button {
    margin: 0;
  }

  .manage-subscriptions {
    margin: 0;
  }

  .user-actions {
    display: flex;
    column-gap: var(--spacing);
    align-items: center;
  }
</style>
