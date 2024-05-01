<script lang="ts">
  import TafsDisplay from '$components/tafs/TafsDisplay.svelte';
  export let results = [];
</script>

{#if results.length}
  <TafsDisplay tafs={results} />
{:else}
  <p>No Results</p>
{/if}
