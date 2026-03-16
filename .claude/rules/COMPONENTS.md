# Components

Frontend components are written in Svelte.

## Legacy

The codebase uses Svelte 4 syntax on the Svelte 5 runtime. Write new components in existing Svelte 4 syntax.

## Location

- **Page-specific** components: colocate with their page in `src/routes/`
- **Reusable** components: `src/components/`
- **Stores** for cross-component state: colocate with their relevant components

## Example

```svelte
<script lang="ts">
  /**
   * Describe the component here.
   *
   * @prop name - Describe the prop here.
   *
   * Example usage:
   *
   *   <Component name="example" />
   *
   */
  // Dependencies
  import { onMount } from 'svelte';

  // Props
  export let name: string = undefined;

  // State
  let count = 0;

  // Lifecycle hooks
  onMount(() => {
    count = 1;
  });

  // Functions
  function upCount() {
    count++;
  }
</script>

<div>
  <p class="name">{name}</p>
  <p>{count}</p>
  <button on:click={upCount}>Up Count</button>
</div>

<style>
  .name {
    font-weight: bold;
  }
</style>
```
