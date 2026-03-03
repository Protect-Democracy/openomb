<script lang="ts">
  import { createSwitch } from '@melt-ui/svelte';
import type { Writable } from 'svelte/store';

// Props
export let id: string;
export let label: string;
export let checked: Writable<boolean>;
export let variant: string = '';

// Make switch parts
const {
  elements: { root, input }
} = createSwitch({
  checked,
  onCheckedChange: ({ next }) => {
    checked.set(next);
    return next;
  }
});
</script>

<form>
  <div class="flex items-center">
    <label for={id} id="{id}-label">
      {label}
    </label>

    <button class="button-switch {variant}" {...$root} use:root {id} aria-labelledby="{id}-label">
      <span class="button-switch-slider"></span>
    </button>

    <input {...$input} use:input />
  </div>
</form>

<style>
</style>
