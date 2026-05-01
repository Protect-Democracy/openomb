<script lang="ts">
  import { resolve } from '$app/paths';
</script>

<div class="page-message-container">
  <div class="message-box">
    <h1>Check your email</h1>

    <p class="callout-container-large">A sign-in link has been sent to your email address.</p>

    <p>Entered the wrong email? <a href={resolve('/subscribe')}>Start over</a></p>

    <small>
      By logging in and subscribing to email updates you agree to the OpenOMB's <a
        href={resolve('/privacy-policy')}>privacy policy</a
      >.
    </small>
  </div>
</div>

<style>
  .message-box {
    text-align: center;
  }

  small {
    display: block;
    margin-top: calc(var(--spacing) * 3);
    color: var(--color-text-muted);
  }
</style>
