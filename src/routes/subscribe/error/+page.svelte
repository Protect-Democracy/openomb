<script lang="ts">
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';
  import LogIn from '$components/subscriptions/LogIn.svelte';

  const url = derived(page, ($page) => $page.url);

  const errors = {
    default: {
      status: 200,
      heading: 'Error',
      message: ['Unknown error'],
    },
    Configuration: {
      status: 500,
      heading: "Server error",
      message: [
        'There is a problem with the server configuration.',
        'Check the server logs for more information.',
      ],
    },
    AccessDenied: {
      status: 403,
      heading: "Access Denied",
      message: [
        'You do not have permission to sign in.',
      ],
    },
    Verification: {
      status: 403,
      heading: "Unable to sign in",
      message: [
        'The sign in link is no longer valid.',
        'It may have been used already or it may have expired.',
      ],
    },
  };

  $: error = errors[$url.searchParams.get('error') || 'default']

</script>

<div class="page-container content-container">
  <h1>{error.heading}</h1>
  <div className="message">
    {#each error.message as line}
      <p>{line}</p>
    {/each}
  </div>
  <h3>Receive a new login email</h3>
  <LogIn callbackUrl="/subscribe" />
</div>
