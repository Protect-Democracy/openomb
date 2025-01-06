<script lang="ts">
  import LogIn from './LogIn.svelte';

  // Props
  export let user;
  export let subType;
  export let subItemId;
</script>

{#if user}
  <a data-sveltekit-reload href={`/subscribe/${subType}/${subItemId}`}>Subscribe</a>
{:else}
  <LogIn callbackUrl={`/subscribe/${subType}/${subItemId}`} action="Subscribe" />
{/if}
