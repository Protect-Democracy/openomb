<!--
  Auth.js Login Component

  Note: This was copied from the component within Auth.js's sveltekit library.
  Their sign-in does not allow for inline functionality

  Params
    - callbackUrl: Url to redirect the user to once they've signed in
    - action: Text to use on login button (defaults to Authenticate)
  Slots
    None
-->
<script lang="ts">
  // Props
  export let callbackUrl;
  export let action = 'Send link';
</script>

<form class="login-form" action="/auth/signin/http-email" method="POST">
  <input type="hidden" name="csrfToken" />
  <input type="hidden" name="providerId" value="email" />
  <input type="hidden" name="callbackUrl" value={callbackUrl} />

  <div class="login-input">
    <label for="input-email-for-http-email-provider" class="sr-only">Email</label>

    <input
      id="input-email-for-http-email-provider"
      type="email"
      name="email"
      placeholder="email@example.com"
      required
    />
  </div>

  <button type="submit">{action}</button>
</form>

<style>
  .login-form {
    display: flex;
    margin-bottom: var(--spacing);
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
    }
  }

  button {
    font-size: var(--font-size-medium);
    padding: var(--spacing) var(--spacing-double);
    min-width: auto;
    border-bottom-left-radius: 0;
    border-top-left-radius: 0;
    margin: 0;
  }
</style>
