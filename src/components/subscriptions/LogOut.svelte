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
</script>

<!-- Form setup copied from auth.js's sveltekit component -->
<!-- Their SignIn component does not provide an inline option -->

<form method="POST" action="/subscribe?/logout">
  <input type="hidden" name="redirectTo" value={callbackUrl} />
  <button class="auth" type="submit">{action}</button>
</form>
