<!--
  Auth.js Login Component

  Note: This was copied from the component within Auth.js's sveltekit library.
  Their sign-in does not allow for inline functionality

  Params
    - callbackUrl: Url to redirect the user to once they've signed in
    - action: Text to use on login button (defaults to Authenticate)
    - defaultLoginMessage: Whether to show the default login message after
      successful login (defaults to true).  Useful to turn off if you want to handle showing
      a message on successful login within the parent component.
  Events
    - onLogin: Triggered when login is successful and passes the email address used to login.
    - onLoginError: Triggered when login is unsuccessful and passes the email address used to login.
  Slots
    None
-->
<script lang="ts">
  import { signIn } from '@auth/sveltekit/client';
  import SpinnerIcon from '$components/icons/Spinner.svelte';

  // Constatns
  const defaultErrorMessage = 'Something went wrong. Please try again.';

  // Props
  export let callbackUrl: string;
  export let action = 'Send link';
  export let actionLoading = 'Sending…';
  export let defaultLoginMessage: boolean = true;
  // Event prop that gets triggers when login is successful and passes the email
  // address used to login.
  export let onLogin: ((email: string) => void) | null = null;
  // Event prop that gets triggers when login is unsuccessful and passes the email
  // address used to login.
  export let onLoginError: ((email: string) => void) | null = null;

  // State
  let email = '';
  let submitted = false;
  let loading = false;
  let errorMessage: string | null = null;

  // Client side login function
  async function handleSubmit() {
    loading = true;
    errorMessage = null;

    try {
      const result = await signIn('http-email', { email, callbackUrl, redirect: false });
      // If we wanted to redirect, result.url should be in response

      // TODO: Remove later, but adding this because prod and local are acting differently.
      console.info(result);

      if (result?.ok && !result.error) {
        submitted = true;
        if (onLogin) {
          onLogin(email);
        }
      } else if (result.error) {
        // Unsure if error message is user friendly.  If a non-email is sent, the error
        // message is just "Configuration"
        errorMessage = defaultErrorMessage;
        if (onLoginError) {
          onLoginError(email);
        }
      } else {
        errorMessage = defaultErrorMessage;
        if (onLoginError) {
          onLoginError(email);
        }
      }
    } catch (e) {
      // TODO: Remove later, but adding this because prod and local are acting differently.
      console.error(e);

      errorMessage = defaultErrorMessage;
      if (onLoginError) {
        onLoginError(email);
      }
    } finally {
      loading = false;
    }
  }
</script>

{#if defaultLoginMessage && submitted}
  <p>
    An email has been sent to <strong>{email}</strong>. Entered the wrong email?
    <button class="like-link compact" on:click={() => (submitted = false)}>Start over</button>
  </p>
{:else}
  <form
    class="login-form"
    action="/auth/signin/http-email"
    method="POST"
    on:submit|preventDefault={handleSubmit}
  >
    <input type="hidden" name="csrfToken" />
    <input type="hidden" name="providerId" value="email" />
    <input type="hidden" name="callbackUrl" value={callbackUrl} />

    <div class="login-input">
      <label for="input-email-for-http-email-provider" class="sr-only">Email</label>

      <input
        id="input-email-for-http-email-provider"
        name="email"
        type="email"
        placeholder="email@example.com"
        bind:value={email}
        required
      />
    </div>

    <button type="submit" disabled={loading}>
      {#if loading}
        <span class="button-icon"><SpinnerIcon /></span> {actionLoading}
      {:else}
        {action}
      {/if}
    </button>
  </form>

  {#if errorMessage}
    <p class="error">{errorMessage}</p>
  {/if}
{/if}

<style>
  .login-form {
    display: flex;
    margin-bottom: var(--spacing);

    @media (max-width: 550px) {
      & {
        flex-direction: column;
      }
    }
  }

  .login-input {
    position: relative;
    flex: auto 1 0;

    input {
      width: 100%;
      font-size: var(--font-size-medium);
      padding: var(--spacing);
      border-width: var(--border-weight);
      border-bottom-right-radius: 0;
      border-top-right-radius: 0;
      min-width: 0;

      @media (max-width: 550px) {
        & {
          border-bottom-right-radius: var(--border-radius);
          border-top-right-radius: var(--border-radius);
          margin-bottom: var(--spacing-half);
        }
      }
    }
  }

  button {
    font-size: var(--font-size-medium);
    padding: var(--spacing) var(--spacing-double);
    width: auto;
    min-width: calc(var(--spacing) * 10);
    border-bottom-left-radius: 0;
    border-top-left-radius: 0;
    margin: 0;

    @media (max-width: 550px) {
      & {
        border-bottom-left-radius: var(--border-radius);
        border-top-left-radius: var(--border-radius);
        width: 100%;
      }
    }
  }

  .button-icon {
    margin-left: calc(var(--spacing) * -1);
  }

  .error {
    color: var(--color-error);
    font-size: var(--font-size-small);
  }
</style>
