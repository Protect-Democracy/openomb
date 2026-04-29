<script lang="ts">
  import LogIn from './LogIn.svelte';

  // Props
  export let callbackUrl: string;
</script>

<div class="login-box">
  <h2 class="h1">Log in or create an account</h2>

  <p>
    Enter your email address to log in or create a new subscription account. You will be sent a
    “magic link” with your account email to log in, enabling you to subscribe to updates for various
    feeds.
  </p>

  <LogIn {callbackUrl} />

  <small>
    By logging in and subscribing to email updates you agree to the OpenOMB's <a
      href="/privacy-policy">privacy policy</a
    >.
  </small>
</div>

<style>
  .login-box {
    background-color: var(--color-background);
    max-width: calc(var(--page-width-small) - var(--spacing) * 4);
    padding: calc(var(--spacing) * 5) calc(var(--spacing) * 7);
    border: var(--border-weight) solid var(--color-text);
    border-radius: 0;

    @media (max-width: 900px) {
      & {
        padding: calc(var(--spacing) * 3) calc(var(--spacing) * 3);
      }
    }

    @media (max-width: 550px) {
      & {
        padding: calc(var(--spacing) * 1) calc(var(--spacing) * 1);
        border: none;
        background-color: transparent;
      }
    }
  }

  h2 {
    text-align: center;
    padding-top: 0;
    margin-top: 0;
  }

  p {
    margin-bottom: var(--spacing);
    text-align: center;
  }

  small {
    display: block;
    text-align: center;
    margin-top: calc(var(--spacing) * 3);
    color: var(--color-text-muted);
  }
</style>
