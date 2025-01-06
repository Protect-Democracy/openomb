<script lang="ts">
  // Props
  export let user;
</script>

{#if user}
  <button formmethod="post" formaction="?/subscribe">Subscribe</button>
{/if}
