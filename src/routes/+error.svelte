<script>
  import { page } from '$app/stores';
  throw new Error('help');
</script>

<div class="page-container content-container">
  <!-- eslint-disable svelte/valid-compile -->
  <h1>Error: {$page.status}</h1>

  <p>{$page.error?.message || 'Unknown error'}. <a href="/">Go back to home page</a>.</p>
  <!-- eslint-enable svelte/valid-compile -->
</div>
