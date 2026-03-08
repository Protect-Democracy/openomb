<script>
  import Wrapper from '$email/components/Wrapper.svelte';
  import { contactEmail, deployedBaseUrl, siteName } from '$config';

  export let title = 'Login';
  export let authUrl;
  export let subscriptionsUrl;
</script>

<Wrapper {title} {subscriptionsUrl} unsubscribable={false}>
  <p>Use the link below to login to your account.</p>

  <a class="button compact" href={authUrl} target="_blank">Login</a>

  <div style="margin-top: 2rem;">
    <p class="font-small">
      You are receiving this email because you are attempting to login or requested a subscription
      on <a href={deployedBaseUrl} target="_blank">{siteName}</a>. If you did not request this
      email, please contact
      <a href="mailto:{contactEmail}">{contactEmail}</a>.
    </p>
  </div>
</Wrapper>
