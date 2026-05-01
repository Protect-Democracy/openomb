<script lang="ts">
  import type { PageData } from './$types';
  import { filter, sortBy } from 'lodash-es';
  import LogOut from '$components/subscriptions/LogOut.svelte';
  import LogIn from '$src/components/subscriptions/LogIn.svelte';
  import SubscriptionGroup from './SubscriptionGroup.svelte';

  export let data: PageData;
  export let form;
  $: ({ userSubscriptions, user } = data);

  $: folderSubs = sortBy(
    filter(userSubscriptions, (sub) => sub.type === 'folder'),
    'description'
  );
  $: tafsSubs = sortBy(
    filter(userSubscriptions, (sub) => sub.type === 'tafs'),
    'description'
  );
  $: agencySubs = sortBy(
    filter(userSubscriptions, (sub) => sub.type === 'agency'),
    'description'
  );
  $: bureauSubs = sortBy(
    filter(userSubscriptions, (sub) => sub.type === 'bureau'),
    'description'
  );
  $: accountSubs = sortBy(
    filter(userSubscriptions, (sub) => sub.type === 'account'),
    'description'
  );
  $: searchSubs = sortBy(
    filter(userSubscriptions, (sub) => sub.type === 'search'),
    'description'
  );
</script>

<div class="background-container" class:no-user={!user}>
  <div class="page-container">
    {#if user}
      <section class="content-container text-container">
        <h1>Your Account</h1>

        <section class="callout-container account-info">
          <div class="info">
            <span>Logged in as:</span>
            <span>{user.email}</span>
          </div>

          <div class="actions">
            <LogOut
              callbackUrl="/subscribe"
              buttonProps={{
                class: 'like-link like-text alt'
              }}
            />
          </div>
        </section>

        <p class="account-info-help">
          <strong>Need help?</strong> Email
          <a href="mailto:contact@openomb.org">contact@openomb.org</a> for questions, support, or to report
          issues.
        </p>

        <h2 class="h2-alt">Manage Subscriptions</h2>

        <p>
          Adjust how frequently you are sent email updates about a data feed or remove a data feed
          from your updates. Your adjustments will be saved automatically during each session.
        </p>

        {#if form?.success}
          <p class="form-success">Subscriptions saved successfully!</p>
        {:else if form?.error}
          <p class="form-error">
            There was an error saving your subscription data. Please try again or, if problems
            persist, contact support@openomb.org.
          </p>
        {/if}

        <table>
          <thead>
            <tr>
              <td class="sub-link">Subscription</td>
              <td class="sub-frequency">Email Frequency</td>
              <td class="sub-remove sr-only">Remove Subscription</td>
            </tr>
          </thead>

          {#if userSubscriptions.length === 0}
            <tbody>
              <tr>
                <td colspan="3"
                  ><em
                    >No subscriptions found. Navigate to an agency, file, search, etc. to subscribe
                    to different feeds of data.</em
                  ></td
                >
              </tr>
            </tbody>
          {:else}
            <tbody>
              <SubscriptionGroup title="Searches" subs={searchSubs} />
              <SubscriptionGroup title="Folders" subs={folderSubs} />
              <SubscriptionGroup title="Agencies" subs={agencySubs} />
              <SubscriptionGroup title="Bureaus" subs={bureauSubs} />
              <SubscriptionGroup title="Accounts" subs={accountSubs} />
              <SubscriptionGroup title="TAFS" subs={tafsSubs} />
            </tbody>
          {/if}
        </table>
      </section>

      <section class="content-container">
        <h2>Account management</h2>

        <div class="page-section">
          <h3>Log out</h3>

          <p>End the current user session tied to this email address.</p>
          <LogOut callbackUrl="/subscribe" />
        </div>

        <div class="page-section">
          <h3>Delete account</h3>

          <p>
            <strong>Warning: this action cannot be undone.</strong> Delete this email address and all
            associated data from the website. This will destroy all subscriptions associated with the
            current email. You will be able to re-subscribe in the future.
          </p>

          <form method="POST" action="/subscribe?/deactivate">
            <button class="auth">Delete Account & Data</button>
          </form>
        </div>
      </section>
    {:else}
      <section class="page-message-container">
        <div class="message-box">
          <LogIn callbackUrl="/subscribe" />
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  .content-container:has(+ .content-container) {
    margin-bottom: 0;
  }

  .account-info {
    display: flex;
    gap: var(--spacing-double);
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--spacing);

    .info span {
      display: block;
    }

    .info span:first-child {
      font-size: var(--font-size-slight);
      font-weight: var(--font-copy-weight-bold);
      margin-bottom: var(--spacing-half);
    }
  }

  .account-info-help {
    margin-bottom: var(--spacing-large);
  }

  .form-success {
    font-weight: var(--font-copy-weight-bold);
    color: var(--color-green-dark);
  }

  .form-error {
    font-weight: var(--font-copy-weight-bold);
    color: var(--color-error);
  }

  table {
    margin-bottom: var(--spacing-double);
  }

  thead {
    font-size: var(--font-size-small);
    color: var(--color-text-muted);
    font-weight: var(--font-copy-weight-light);
    text-transform: uppercase;

    td {
      vertical-align: bottom;
      padding: var(--spacing);
    }
  }

  @media (max-width: 768px) {
    .actions {
      flex-direction: column;
      row-gap: var(--spacing-double);
    }
  }

  .background-container.no-user {
    padding-top: var(--spacing-triple);
    padding-bottom: var(--spacing-triple);
    background-color: var(--color-subscribe-background);
  }
</style>
