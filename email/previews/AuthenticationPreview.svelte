<script lang="ts">
  import AuthenticationEmail from '../templates/AuthenticationEmail.svelte';
  export let authUrl = 'https://example.com';
</script>

<AuthenticationEmail {authUrl} />
