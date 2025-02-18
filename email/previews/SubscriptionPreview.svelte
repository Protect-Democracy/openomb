<script lang="ts">
  import SubscriptionEmail from '../templates/SubscriptionEmail.svelte';
  export let authUrl = 'https://example.com';
  export let subscriptionItemDescription = '';
</script>

<SubscriptionEmail {authUrl} {subscriptionItemDescription} />
