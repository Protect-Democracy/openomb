<script lang="ts">
  import LogInForm from './LogInForm.svelte';
  import { resolve } from '$app/paths';

  // Props
  export let callbackUrl: string;
</script>

<h2 class="h1">Log in or create an account</h2>

<p>
  Enter your email address to log in or create a new subscription account. You will be sent a “magic
  link” with your account email to log in, enabling you to subscribe to updates for various feeds.
</p>

<LogInForm {callbackUrl} />

<small>
  By logging in and subscribing to email updates you agree to the OpenOMB's <a
    href={resolve('/privacy-policy')}>privacy policy</a
  >.
</small>

<style>
  h2 {
    text-align: center;
    padding-top: 0;
    margin-top: 0;
  }

  p {
    margin-bottom: var(--spacing-double);
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    max-width: calc(var(--copy-width-limit) - var(--spacing-double));
  }

  small {
    display: block;
    text-align: center;
    margin-top: calc(var(--spacing) * 3);
    color: var(--color-text-muted);
  }
</style>
