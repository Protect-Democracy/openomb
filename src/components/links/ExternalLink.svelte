<script lang="ts">
  /**
 * An external link that checks if the URL is reachable.
 */
import { onMount } from 'svelte';

// Props
export let url: string;
export let linkClass = '';

// State
let reachable = false;

async function checkUrl(url: string) {
  try {
    let response = await fetch(`/api/v1/url-checker?url=${encodeURIComponent(url)}`);
    let parsed = await response.json();
    reachable = parsed && parsed.results.reachable;
  }
  catch (error) {
    reachable = false;
  }
}

onMount(() => {
  checkUrl(url);
});
</script>

{#if reachable}
  <a class={linkClass} href={url} target="_blank" rel="noopener noreferrer">
    <slot />
  </a>
{:else}
  <slot />
{/if}
