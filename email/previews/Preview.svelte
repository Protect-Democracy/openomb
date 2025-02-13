<script lang="ts">
  import FileNotificationPreview from './FileNotificationPreview.svelte';

  // Comes in from the render function via the server
  export let url = '';
</script>

{#if url === 'file-notifications'}
  <FileNotificationPreview />
{:else}
  <h1>Email previews</h1>

  <p>Make sure to test in actual email clients as well.</p>

  <nav>
    <ul>
      <li><a href="/file-notifications">File Notifications</a></li>
    </ul>
  </nav>
{/if}

<style>
</style>
