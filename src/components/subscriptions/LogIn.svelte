<script lang="ts">
  import LogInForm from './LogInForm.svelte';
  import { resolve } from '$app/paths';

  // Props
  export let callbackUrl: string;
  export let headingClass: string = 'h1';

  // State
  let userEmail: string | null = null;
  let emailSent = false;

  // Handle successful login
  function onLoginSuccess(email: string) {
    userEmail = email;
    emailSent = true;
  }

  // Handle login reset
  function resetLogin() {
    userEmail = null;
    emailSent = false;
  }
</script>

<div>
  {#if emailSent}
    <h2 class={headingClass}>Check your email</h2>

    <p class="callout-container-large">
      A sign-in link has been sent to {#if userEmail}<br /><strong>{userEmail}</strong>{:else}your
        email address{/if}.
    </p>

    <p>
      Entered the wrong email?
      <button class="button-link" on:click|preventDefault={resetLogin}>Start over</button>
    </p>
  {:else}
    <h2 class={headingClass}>Log in or create an account</h2>

    <p>
      Enter your email address to log in or create a new subscription account. You will be sent a
      “magic link” with your account email to log in, enabling you to subscribe to updates for
      various feeds.
    </p>

    <LogInForm {callbackUrl} defaultLoginMessage={false} onLogin={onLoginSuccess} />
  {/if}

  <small>
    By logging in and subscribing to email updates you agree to the OpenOMB's <a
      href={resolve('/privacy-policy')}>privacy policy</a
    >.
  </small>
</div>

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

  .callout-container-large {
    margin-bottom: var(--spacing);
  }
</style>
