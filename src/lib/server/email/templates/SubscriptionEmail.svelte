<script>
  import Wrapper from '$email/components/Wrapper.svelte';
  import { contactEmail, deployedBaseUrl, siteName } from '$config';

  export let title = 'Subscribe to apportionments';
  export let subscriptionsUrl = undefined;
  export let subscriptionItemDescription;
  export let authUrl;
</script>

<Wrapper {title} {subscriptionsUrl} unsubscribable={false}>
  <p>
    Use the link below to subscribe to newly approved apportionments
    {#if subscriptionItemDescription}
      for <strong>{subscriptionItemDescription}</strong>.
    {:else}
      on {siteName}.
    {/if}
  </p>

  <a class="button compact" href={authUrl} target="_blank">Subscribe</a>

  <div style="margin-top: 2rem;">
    <p class="font-small">
      You are receiving this email because you requested a subscription on <a
        href={deployedBaseUrl}
        target="_blank">{siteName}</a
      >. If you did not request this email, please contact
      <a href="mailto:{contactEmail}">{contactEmail}</a>.
    </p>
  </div>
</Wrapper>
