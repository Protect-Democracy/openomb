<!--
  Auth.js Logout Component

  Params
    - callbackUrl: Url to redirect the user to once they've signed out
    - action: Text to use on logout button (defaults to Log Out)
  Slots
    None
-->
<script lang="ts">
  // Props
  export let callbackUrl;
  export let action = 'Log Out';
  export let buttonProps = {};
</script>

<!-- Form setup copied from auth.js's sveltekit component -->
<!-- Their SignIn component does not provide an inline option -->

<form method="POST" action="/auth/signout">
  <input type="hidden" name="csrfToken" />
  <input type="hidden" name="providerId" value="email" />
  <input type="hidden" name="callbackUrl" value={callbackUrl} />
  <button class="auth" type="submit" {...buttonProps}>{action}</button>
</form>
