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
  import { deserialize } from '$app/forms';
  import Spinner from '$components/icons/Spinner.svelte';
  import LogIn from './LogIn.svelte';
  import { subscribeFeatureEnabled } from '$config/subscriptions';

  // Props
  export let user;
  export let url;
  export let existingSubscription;
  export let overrideFeatureFlag = false;

  let addedSubscription = existingSubscription;
  let loading = false;

  async function subscribe() {
    loading = true;

    // Shortcuts
    const u = (p: string) => url.searchParams.get(p);
    const ga = (p: string) => url.searchParams.getAll(p);

    const agencyBureau = url.searchParams.get('agencyBureau')?.split(',');
    const criterion = {
      term: u('term') || '',
      tafs: u('tafs') || '',
      bureau: agencyBureau?.[1] || '',
      agency: agencyBureau?.[0] || '',
      account: u('account') || '',
      approver: ga('approver').join(',') || '',
      year: ga('year').join(','),
      approvedStart: u('approvedStart') ? new Date(`${u('approvedStart')}T00:00:00`) : undefined,
      approvedEnd: u('approvedEnd') ? new Date(`${u('approvedEnd')}T23:59:59`) : undefined,
      lineNum: ga('lineNum').join(','),
      footnoteNum: ga('footnoteNum').join(',')
    };

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

{#if overrideFeatureFlag || subscribeFeatureEnabled}
  <aside class="subscribe-action">
    {#if addedSubscription}
      <p class="muted">
        You are receiving email updates when new files are approved matching this search
      </p>
    {:else}
      <p class="muted">Receive email updates when new files are approved matching this search</p>
    {/if}
    {#if user}
      <div class="has-js-only-block">
        <button
          class="button compact"
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
          <a class="button compact" href={`/subscribe/search/${existingSubscription.itemId}/remove`}
            >Unsubscribe</a
          >
        {:else}
          <a class="button compact" href={`/subscribe/search?${url.searchParams.toString()}`}
            >Subscribe</a
          >
        {/if}
      </div>
    {:else}
      <LogIn callbackUrl={`/subscribe/search?${url.searchParams.toString()}`} action="Subscribe" />
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
