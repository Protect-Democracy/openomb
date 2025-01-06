<script lang="ts">
  import { beforeNavigate, invalidateAll } from '$app/navigation';

  // Props
  export let callbackUrl;
  export let action = 'Log Out';

  // We need to invalidate this route so that our session is reloaded
  /*beforeNavigate(() => {
    invalidateAll();
  });*/
</script>

<!-- Form setup copied from auth.js's sveltekit component -->
<!-- Their SignIn component does not provide an inline option -->

<form method="POST" action="/subscribe?/logout">
  <input type="hidden" name="redirectTo" value={callbackUrl}>
  <button type="submit">{action}</button>
</form>
