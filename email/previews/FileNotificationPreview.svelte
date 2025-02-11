<script lang="ts">
  import FileNotificationEmail from '../templates/FileNotificationEmail.svelte';
</script>

<FileNotificationEmail
  notifications={[
    {
      title: 'File 1',
      url: 'https://example.com/file1',
      description: 'This is a description of file 1.'
    },
    {
      title: 'File 2',
      url: 'https://example.com/file2',
      description: 'This is a description of file 2.'
    }
  ]}
/>
