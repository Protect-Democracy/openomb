<script lang="ts">
  import { resolve } from '$app/paths';
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';
  import LogInForm from '$src/components/subscriptions/LogInForm.svelte';
  import XSymbol from '$src/components/icons/XSymbol.svelte';

  const url = derived(page, ($page) => $page.url);

  const errors = {
    default: {
      status: 200,
      heading: 'Error',
      message: ['Unknown error']
    },
    Configuration: {
      status: 500,
      heading: 'Server error',
      message: [
        'There is a problem with the server configuration.',
        'Check the server logs for more information.'
      ]
    },
    AccessDenied: {
      status: 403,
      heading: 'Access Denied',
      message: ['You do not have permission to sign in.']
    },
    Verification: {
      status: 403,
      heading: 'Unable to sign in',
      message: [
        'The sign in link is no longer valid.',
        'It may have been used already or it may have expired.'
      ]
    }
  };

  $: errorName = $url.searchParams.get('error') || 'default';
  $: error = errorName in errors ? errors[errorName] : errors['default'];
</script>

<div class="page-message-container">
  <div class="message-box">
    <div class="highlight-icon error"><XSymbol /></div>

    <h1>{error.heading}</h1>

    <p>
      {#each error.message as line (line)}{line} &nbsp;
      {/each}
    </p>

    <p><strong>Try again. Send another email:</strong></p>

    <LogInForm callbackUrl="/subscribe" />

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

  .highlight-icon {
    font-size: calc(var(--spacing) * 4);
    padding: 0.25em;
  }

  small {
    display: block;
    margin-top: calc(var(--spacing) * 3);
    color: var(--color-text-muted);
  }
</style>
