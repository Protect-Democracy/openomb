<script lang="ts">
  import FileNotificationPreview from './FileNotificationPreview.svelte';
  import SubscriptionPreview from './SubscriptionPreview.svelte';
  import AuthenticationPreview from './AuthenticationPreview.svelte';

  // Comes in from the render function via the server
  export let url = '';
</script>

{#if url === 'file-notifications'}
  <FileNotificationPreview />
{:else if url === 'subscription'}
  <SubscriptionPreview />
{:else if url === 'subscription-item'}
  <SubscriptionPreview subscriptionItemDescription="Department of Awesome" />
{:else if url === 'authentication'}
  <AuthenticationPreview />
{:else}
  <h1>Email previews</h1>

  <p>Make sure to test in actual email clients as well.</p>

  <nav>
    <ul>
      <li><a href="/file-notifications">File Notifications</a></li>
      <li><a href="/subscription">Subscription</a></li>
      <li><a href="/subscription-item">Subscription (with item description)</a></li>
      <li><a href="/authentication">Authentication</a></li>
    </ul>
  </nav>
{/if}

<style>
</style>
