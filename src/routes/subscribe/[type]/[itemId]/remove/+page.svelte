<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
  $: ({ type, subscription } = data);
</script>

<div class="page-container content-container">
  {#if subscription}
    <h2>Successfully unsubscribed from {subscription.description}</h2>
    <p>
      You will no longer receive email updates when new files are approved for this {type}. You can
      view, and modify, remaining notifications on the
      <a data-sveltekit-reload href="/subscribe">subscription page.</a>
    </p>
    <p>
      <a href={subscription.itemLink}>Go back to {subscription.description}</a>
    </p>
  {:else}
    <h2>There is no subscription for this {type} associated with this email address.</h2>
  {/if}
</div>
