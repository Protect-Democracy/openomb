<script lang="ts">
  import { filter } from 'lodash-es';
  import LogIn from '$components/subscriptions/LogIn.svelte';
  import LogOut from '$components/subscriptions/LogOut.svelte';
  import SubscriptionGroup from './SubscriptionGroup.svelte';


  export let data: PageData;
  export let form;
  $: ({ userSubscriptions, user } = data);

  console.log(form);

  $: folderSubs = filter(userSubscriptions, (sub) => sub.type === 'folder');
  $: fileSubs = filter(userSubscriptions, (sub) => sub.type === 'file');
  $: agencySubs = filter(userSubscriptions, (sub) => sub.type === 'agency');
  $: bureauSubs = filter(userSubscriptions, (sub) => sub.type === 'bureau');
  $: accountSubs = filter(userSubscriptions, (sub) => sub.type === 'account');
  $: searchSubs = filter(userSubscriptions, (sub) => sub.type === 'search');
</script>

<div class="page-container">
  {#if user}
    <section class="content-container">
      <h2>Subscriptions</h2>
      <p>
        Adjust how frequently you are sent updates about a subscription or unsubscribe from the provided entry entirely.  Any adjustments will be saved when the form is submitted.
      </p>

      {#if form?.success}
        <p>Subscriptions saved successfully!</p>
      {/if}

      <form method="POST" action="/subscribe?/manage">
        <table>
          <thead>
            <tr>
              <td class="sub-link">Subscription</td>
              <td class="sub-frequency">Frequency</td>
              <td class="sub-remove">Remove?</td>
            </tr>
          </thead>
          <tbody>
            <SubscriptionGroup title="Folders" subs={folderSubs} />
            <SubscriptionGroup title="Files" subs={fileSubs} />
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
            <p>Delete this email address and all associated data from the website.  This will destroy all subscriptions associated with the current email.  You will be able to re-subscribe in the future.</p>
            <button>Delete Account & Data</button>
          </form>
        </div>
      </div>
    </section>
  {:else}
    <section class="content-container">
      <LogIn callbackUrl="/subscribe?reload=1" />
    </section>
  {/if}
</div>

<style>
  .content-container:has(+ .content-container) {
    margin-bottom: 0;
  }
  .actions {
    display: flex;
    column-gap: var(--spacing-double);
    align-items: flex-end;
  }

  .action-col {
    text-align: center;
  }

</style>
