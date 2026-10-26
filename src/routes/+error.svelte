<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/stores';
</script>

<div class="page-container content-container">
  <!-- eslint-disable svelte/valid-compile -->
  <h1>Error: {$page.status}</h1>

  <p>{$page.error?.message || 'Unknown error'}. <a href={resolve('/')}>Go back to home page</a>.</p>
  <!-- eslint-enable svelte/valid-compile -->
</div>
