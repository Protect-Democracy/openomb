<script lang="ts">
  import FileNotificationEmail from '../templates/FileNotificationEmail.svelte';
  import previewData from './file-notification-preview-data.json';
</script>

<FileNotificationEmail subscriptions={previewData} />
