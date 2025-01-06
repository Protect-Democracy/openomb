<script lang="ts">
  import { beforeNavigate, invalidateAll } from '$app/navigation';

  // Props
  export let callbackUrl;
  export let action = 'Authenticate';

  // We need to invalidate this route so that our session is reloaded
  /*beforeNavigate(() => {
    invalidateAll();
  });*/
</script>

<!-- Form setup copied from auth.js's sveltekit component -->
<!-- Their SignIn component does not provide an inline option -->

<form action="/auth/signin/http-email" method="POST">
  <input type="hidden" name="csrfToken" />
  <input type="hidden" name="providerId" value="email" />
  <input type="hidden" name="callbackUrl" value={callbackUrl} />
  <label for="input-email-for-http-email-provider">Email</label>
  <input id="input-email-for-http-email-provider" type="email" name="email" placeholder="email@example.com" />
  <button class="compact" id="submitButton" type="submit" tabindex="0">{action}</button>
</form>
