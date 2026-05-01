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
  import { captureException } from '@sentry/svelte';
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { deserialize } from '$app/forms';
  import { resolve } from '$app/paths';
  import {
    clientGetUser,
    clientGetSubscriptionById,
    clientGetSubscriptionBySearchParams
  } from '$lib/users';
  import { parseUrlSearchParams } from '$lib/searches';
  import Spinner from '$components/icons/Spinner.svelte';
  import Bell from '$components/icons/Bell.svelte';
  import Check from '$components/icons/Check.svelte';
  import LogIn from './LogIn.svelte';
  import Dialog from '$components/dialog/Dialog.svelte';

  // Types
  import type { User, Subscription } from '$lib/users';
  import type { subscriptionSelect } from '$schema/subscriptions';

  // Props
  export let user: User;
  export let subscriptionType: 'entity' | 'search' = 'entity';
  export let variant: 'small' | 'full' | undefined = 'full';
  export let subType:
    | 'folder'
    | 'account'
    | 'agency'
    | 'bureau'
    | 'search'
    | 'file'
    | 'tafs'
    | undefined = undefined;
  export let subItemId: string | undefined = undefined;
  export let subItemFormatted: string | undefined = undefined;
  export let url: URL | undefined = undefined;
  // Existing subscription as determined by the server on page load
  export let existingSubscription: subscriptionSelect | undefined | null = undefined;

  // State
  // Subscription for the current search, if it exists.  This could change if the page
  // is navigated to with client side routing, or if they click (un)subscribe the button.
  let hasSubscription: Subscription | subscriptionSelect | null | undefined = existingSubscription;
  let loading = false;
  let error = false;

  // Derived
  // $: entitySubscriptionType = subscriptionType === 'entity';
  $: searchSubscriptionType = subscriptionType === 'search';

  // Lifecycle
  onMount(async () => {
    // To be able to keep general routes able to use browser caching, we
    // utilize some client side JS to fetch the user data.  Ideally,
    // we could have SvelteKit just make this component client only, but
    // unsure if there is a way to do that.
    await getSubscription();
  });

  afterNavigate(async () => {
    await getSubscription();
  });

  // Methods
  // Get subscription for current search params, if it exists
  async function getSubscription() {
    // Get user
    try {
      // We can't use the cookie since it is HTTP-only, so we fetch user data.
      user = user || (await clientGetUser());
    } catch (err) {
      console.error('Error fetching user', err);
      captureException(err);
      return;
    }

    if (user) {
      try {
        if (subscriptionType === 'search' && url) {
          hasSubscription = await clientGetSubscriptionBySearchParams(url.searchParams);
        } else {
          hasSubscription = await clientGetSubscriptionById(subType || '', subItemId || '');
        }
      } catch (err) {
        console.error('Error fetching subscription for search params', err);
        captureException(err);
        error = true;
      }
    }
  }

  // Subscribe
  async function searchSubscribe() {
    if (!url) {
      throw new Error('URL is required to subscribe to search updates');
    }

    const criterion = parseUrlSearchParams(url.searchParams);
    const searchResp = await fetch('/search?/add', {
      method: 'POST',
      headers: {
        'x-sveltekit-action': 'true'
      },
      body: JSON.stringify({ criterion })
    });

    // @ts-expect-error Unsure how to type the deserialize output.
    const savedSearch = deserialize(await searchResp.text())?.data;
    if (savedSearch) {
      const subResp = await fetch('/subscribe?/add', {
        method: 'POST',
        headers: {
          'x-sveltekit-action': 'true'
        },
        body: JSON.stringify({ type: 'search', itemId: savedSearch.id })
      });

      // @ts-expect-error Unsure how to type the deserialize output.
      hasSubscription = deserialize(await subResp.text())?.data;
    }
  }

  async function entitySubscribe() {
    const subResp = await fetch('/subscribe?/add', {
      method: 'POST',
      headers: {
        'x-sveltekit-action': 'true'
      },
      body: JSON.stringify({ type: subType, itemId: subItemId })
    });

    // @ts-expect-error Unsure how to type the deserialize output.
    hasSubscription = deserialize(await subResp.text())?.data;
  }

  async function subscribe() {
    loading = true;
    error = false;

    try {
      if (subscriptionType === 'search') {
        await searchSubscribe();
      } else {
        await entitySubscribe();
      }
      loading = false;
      return;
    } catch (err) {
      console.error('Error subscribing to search updates', err);
      captureException(err);
      error = true;
      loading = false;
    }
  }

  // Unsubscribe
  async function searchUnsubscribe() {
    if (hasSubscription) {
      await Promise.all([
        fetch('/subscribe?/remove', {
          method: 'POST',
          headers: {
            'x-sveltekit-action': 'true'
          },
          body: JSON.stringify({ subId: hasSubscription.id })
        }),
        fetch('/search?/remove', {
          method: 'POST',
          headers: {
            'x-sveltekit-action': 'true'
          },
          body: JSON.stringify({ searchId: hasSubscription.itemId })
        })
      ]);
    }
  }

  async function entityUnsubscribe() {
    if (hasSubscription) {
      await fetch('/subscribe?/remove', {
        method: 'POST',
        headers: {
          'x-sveltekit-action': 'true'
        },
        body: JSON.stringify({ subId: hasSubscription.id })
      });
    }
  }

  async function unsubscribe() {
    if (hasSubscription) {
      loading = true;
      error = false;

      try {
        if (subscriptionType === 'search') {
          await searchUnsubscribe();
        } else {
          await entityUnsubscribe();
        }
        hasSubscription = null;
        loading = false;
      } catch (err) {
        console.error('Error unsubscribing from search updates', err);
        captureException(err);
        error = true;
        loading = false;
      }
    }
  }
</script>

<aside class:variant-small={variant === 'small'}>
  {#if user}
    <div class="subscribe-description">
      <h3 class="h3-alt">
        {#if hasSubscription}
          <span class="icon icon-check"><Check /></span> You are Subscribed to Updates
        {:else}
          <span class="icon"><Bell /></span> Follow Updates
        {/if}
      </h3>

      <p>
        {#if hasSubscription}
          {#if searchSubscriptionType}
            You are signed up for email updates when new files match this search.
          {:else}
            You are signed up for email updates when new files are approved for <strong
              >{subItemFormatted || `this ${subType}`}</strong
            >.
          {/if}
        {:else if searchSubscriptionType}
          Receive email updates when new files are approved matching this search.
        {:else}
          Receive email updates when new files are approved for <strong
            >{subItemFormatted || `this ${subType}`}</strong
          >.
        {/if}
      </p>
    </div>

    <div class="user-actions">
      <button
        class="medium subscribe"
        class:compact={variant === 'small'}
        on:click={hasSubscription ? unsubscribe : subscribe}
        disabled={loading}
        title={hasSubscription
          ? `Unsubscribe from email updates for approved files`
          : `Subscribe to email updates for approved files`}
      >
        {#if loading}
          <span class="button-icon"><Spinner /></span>
        {/if}
        {hasSubscription ? 'Unsubscribe' : 'Subscribe'}
      </button>

      <div class="manage-subscriptions">
        <a href={resolve('/subscribe')} class="subscribe">Manage subscriptions</a>
      </div>

      {#if error}
        <p class="error color-error font-small">An error occurred. Please try again.</p>
      {/if}
    </div>
  {:else}
    <div class="subscribe-description">
      <h3 class="h3-alt"><span class="icon"><Bell /></span> Follow Updates</h3>

      <p>
        {#if searchSubscriptionType}
          Receive email updates when new files are approved matching this search.
        {:else}
          Receive email updates when new files are approved for <strong
            >{subItemFormatted || `this ${subType}`}</strong
          >.
        {/if}
      </p>

      <small
        >By logging in or subscribing to updates, you agree to the
        <a href={resolve('/privacy-policy')}>OpenOMB privacy policy</a>.</small
      >
    </div>

    <div class="user-actions">
      <Dialog triggerProps={{ class: 'subscribe medium' }}>
        <span slot="trigger">Log In to Subscribe</span>
        <div slot="content">
          <LogIn
            callbackUrl={searchSubscriptionType && url
              ? resolve(`/subscribe/search?${url.searchParams.toString()}`)
              : resolve(`/subscribe/${subType}/${subItemId}`)}
          />
        </div>
      </Dialog>
    </div>
  {/if}
</aside>

<style>
  aside {
    background-color: var(--color-subscribe-background);
    padding: calc(var(--spacing) * 2);
    margin-bottom: var(--spacing);
    max-width: var(--page-width-small);
    display: flex;
    gap: calc(var(--spacing) * 3);
    justify-content: space-between;
    align-items: center;

    &.variant-small {
      padding: var(--spacing);
      gap: calc(var(--spacing) * 2);
    }
  }

  .subscribe-description {
    max-width: 75%;

    p {
      margin-bottom: 0;
    }

    small {
      margin-top: var(--spacing);
      margin-bottom: 0;
      display: block;
    }
  }

  h3 {
    font-size: var(--font-size-medium);
    margin-top: 0;
    padding-top: 0;
    font-weight: var(--font-copy-weight-bold);

    .icon {
      display: inline-block;
      vertical-align: middle;
      width: 1.5em;
      height: 1.5em;
      background-color: var(--color-green-light);
      color: var(--color-white);
      border-radius: var(--border-radius-full);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: var(--spacing-half);
    }
  }

  .icon-check {
    padding: 0.35em;
  }

  .error {
    color: var(--color-error);
    margin: 0;
  }

  .user-actions {
    display: flex;
    gap: var(--spacing-half);
    align-items: center;
    flex-direction: column;

    .variant-small & {
      padding-top: 0;
    }
  }

  .manage-subscriptions a {
    font-weight: bold;
    text-decoration: underline;
    display: block;

    &:hover {
      text-decoration: none;
    }

    .variant-small & {
      font-weight: normal;
      font-size: var(--font-size-small);
    }
  }
</style>
