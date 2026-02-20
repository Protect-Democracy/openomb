<!--
  Search Subscribe Link

  If user is not logged in, shows login form instead, but still redirects to subscribe

  Params
    - user: currently logged in user
    - url: current url object
    - existingSubscription: subscription object for the current search (if one exists)
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
import { clientGetUser, clientGetSubscriptionBySearchParams } from '$lib/users';
import { cookieHasValue } from '$lib/utilities';
import { parseUrlSearchParams } from '$lib/searches';

// Typess
import type { User } from '$lib/users';

// Props
export let user: User;
export let url: URL;
export let variant: 'small' | 'full' | null = 'full';
export let existingSubscription;
export let overrideFeatureFlag = false;

let addedSubscription = existingSubscription;
let loading = false;

onMount(async () => {
  // To be able to keep general routes able to use browser caching, we
  // utilize some client side JS to fetch the user data.  Ideally,
  // we could have SvelteKit just make this component client only, but
  // unsure if there is a way to do that.
  if (await cookieHasValue(sessionCookieName)) {
    user = user || (await clientGetUser());
    addedSubscription =
      addedSubscription || (await clientGetSubscriptionBySearchParams(url.searchParams));
  }
});

// Subscribe
async function subscribe() {
  loading = true;

  const criterion = parseUrlSearchParams(url.searchParams);

  const searchResp = await fetch('/search?/add', {
    method: 'POST',
    headers: {
      'x-sveltekit-action': 'true'
    },
    body: JSON.stringify({ criterion })
  });

  const savedSearch = deserialize(await searchResp.text())?.data;
  if (savedSearch) {
    const subResp = await fetch('/subscribe?/add', {
      method: 'POST',
      headers: {
        'x-sveltekit-action': 'true'
      },
      body: JSON.stringify({ type: 'search', itemId: savedSearch.id })
    });
    addedSubscription = deserialize(await subResp.text())?.data;
  }
  loading = false;
}

async function unsubscribe() {
  loading = true;
  if (addedSubscription) {
    await Promise.all([
      fetch('/subscribe?/remove', {
        method: 'POST',
        headers: {
          'x-sveltekit-action': 'true'
        },
        body: JSON.stringify({ subId: addedSubscription.id })
      }),
      fetch('/search?/remove', {
        method: 'POST',
        headers: {
          'x-sveltekit-action': 'true'
        },
        body: JSON.stringify({ searchId: addedSubscription.itemId })
      })
    ]);
    addedSubscription = null;
  }
  loading = false;
}
</script>

{#if overrideFeatureFlag || subscribeFeatureEnabled || user}
  <aside class="subscribe-action" class:variant-small={variant === 'small'}>
    <p class:font-small={variant === 'small'}>
      {#if addedSubscription}
        You are receiving email updates when new files are approved matching this search.
      {:else}
        Receive email updates when new files are approved matching this search. <br />
        By logging in or subscribing to updates, you agree to the
        <a href="/privacy-policy">OpenOMB privacy policy</a>.
      {/if}
    </p>

    {#if user}
      <div class="user-actions">
        <div class="has-js-only-block">
          <button
            class="button compact subscribe"
            class:small={variant === 'small'}
            on:click={addedSubscription ? unsubscribe : subscribe}
            disabled={loading}
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
              href={`/subscribe/search/${existingSubscription.itemId}/remove`}>Unsubscribe</a
            >
          {:else}
            <a
              class="button compact subscribe"
              class:small={variant === 'small'}
              href={`/subscribe/search?${url.searchParams.toString()}`}>Subscribe</a
            >
          {/if}
        </div>

        <div class="manage-subscriptions">
          <a href="/subscribe" class="subscribe font-small">Manage all subscriptions</a>
        </div>
      </div>
    {:else}
      <LogIn callbackUrl={`/subscribe/search?${url.searchParams.toString()}`} action="Subscribe" />
    {/if}
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
