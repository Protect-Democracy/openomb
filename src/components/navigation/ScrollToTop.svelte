<script lang="ts">
  import { fade } from 'svelte/transition';

  export let threshold = 2000;

  let scrollY;
  let totalHeight;

  function scrollToTop() {
    document.body.scrollIntoView();
  }
</script>

<svelte:body bind:offsetHeight={totalHeight} />

<svelte:window bind:scrollY />

{#if threshold < scrollY && totalHeight > threshold * 2}
  <div class="has-js-only-block scroll-to-top" transition:fade={{ duration: 300 }}>
    <button class="compact alt" on:click={scrollToTop}><slot>Back to top</slot></button>
  </div>
{/if}

<style>
  .scroll-to-top {
    position: fixed;
    bottom: var(--spacing);
    right: var(--spacing);
  }
</style>
