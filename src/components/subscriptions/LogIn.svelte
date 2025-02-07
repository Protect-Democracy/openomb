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
  export let variant: 'small' | 'full' = 'full';
  export let callbackUrl;
  export let action = 'Authenticate';
</script>

<form class="login-form" action="/auth/signin/http-email" method="POST">
  <input type="hidden" name="csrfToken" />
  <input type="hidden" name="providerId" value="email" />
  <input type="hidden" name="callbackUrl" value={callbackUrl} />
  <label for="input-email-for-http-email-provider" class="sr-only">Email</label>
  <input
    id="input-email-for-http-email-provider"
    class:compact={variant === 'small'}
    class:small={variant === 'small'}
    type="email"
    name="email"
    placeholder="email@example.com"
  />

  <button
    class="subscribe compact"
    class:small={variant === 'small'}
    id="submitButton"
    type="submit"
    tabindex="0">{action}</button
  >
</form>

<style>
  .login-form {
    display: flex;
    column-gap: var(--spacing-half);
  }
</style>
