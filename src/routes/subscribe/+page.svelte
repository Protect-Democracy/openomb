<script lang="ts">
  import type { PageData } from './$types';
  import { filter } from 'lodash-es';
  import LogIn from '$components/subscriptions/LogIn.svelte';
  import LogOut from '$components/subscriptions/LogOut.svelte';
  import SubscriptionGroup from './SubscriptionGroup.svelte';

  export let data: PageData;
  export let form;
  $: ({ userSubscriptions, user } = data);

  $: folderSubs = filter(userSubscriptions, (sub) => sub.type === 'folder');
  $: tafsSubs = filter(userSubscriptions, (sub) => sub.type === 'tafs');
  $: agencySubs = filter(userSubscriptions, (sub) => sub.type === 'agency');
  $: bureauSubs = filter(userSubscriptions, (sub) => sub.type === 'bureau');
  $: accountSubs = filter(userSubscriptions, (sub) => sub.type === 'account');
  $: searchSubs = filter(userSubscriptions, (sub) => sub.type === 'search');
</script>

<div class="page-container">
  {#if user}
    <section class="content-container">
      <h1>Subscriptions</h1>

      <p>
        Adjust how frequently you are sent updates about a subscription or unsubscribe from the
        provided entry entirely. Any adjustments will be saved when the form is submitted.
      </p>

      {#if form?.success}
        <p class="form-success">Subscriptions saved successfully!</p>
      {:else if form?.error}
        <p class="form-error">
          There was an error saving your subscription data. Please try again or, if problems
          persist, contact support@openomb.org.
        </p>
      {/if}

      <form method="POST" action="/subscribe?/manage">
        <table>
          <thead>
            <tr>
              <td class="sub-link">Subscription</td>
              <td class="sub-frequency">Email Frequency</td>
              <td class="sub-remove">Remove Subscription?</td>
            </tr>
          </thead>
          <tbody>
            <SubscriptionGroup title="Folders" subs={folderSubs} />
            <SubscriptionGroup title="TAFS" subs={tafsSubs} />
            <SubscriptionGroup title="Agencies" subs={agencySubs} />
            <SubscriptionGroup title="Bureaus" subs={bureauSubs} />
            <SubscriptionGroup title="Accounts" subs={accountSubs} />
            <SubscriptionGroup title="Searches" subs={searchSubs} />
          </tbody>
        </table>
        <div class="actions">
          <div class="action-col">
            <input type="submit" value="Modify Subscriptions" />
          </div>
        </div>
      </form>
    </section>

    <section class="content-container">
      <h2>Account actions</h2>

      <div class="actions">
        <div class="action-col">
          <p>End the current user session tied to this email address.</p>
          <LogOut callbackUrl="/subscribe" />
        </div>
        <div class="action-col">
          <form method="POST" action="/subscribe?/deactivate">
            <p>
              Delete this email address and all associated data from the website. This will destroy
              all subscriptions associated with the current email. You will be able to re-subscribe
              in the future.
            </p>
            <button>Delete Account & Data</button>
          </form>
        </div>
      </div>
    </section>
  {:else}
    <section class="content-container">
      <h1>Login</h1>

      <p>
        Log in using your email address; you will be sent a "magic link" that will log you into the
        site. Once logged in, you can subscribe to different feeds of data.
      </p>

      <LogIn callbackUrl="/subscribe" />
    </section>
  {/if}
</div>

<style>
  .content-container:has(+ .content-container) {
    margin-bottom: 0;
  }
  .form-success {
    font-weight: var(--font-copy-weight-bold);
    color: var(--color-green-dark);
  }
  .form-error {
    font-weight: var(--font-copy-weight-bold);
    color: var(--color-error);
  }
  .sub-remove,
  .sub-frequency {
    text-align: center;
  }
  .actions {
    display: flex;
    column-gap: var(--spacing-double);
    align-items: flex-end;
  }
  .action-col {
    text-align: center;
  }

  @media (max-width: 768px) {
    .actions {
      flex-direction: column;
      row-gap: var(--spacing-double);
    }
  }
</style>
