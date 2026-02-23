<!--
  Tab List Item
  Gets context from Tabs parent

  Params
    label: text for tab toggle element
  Slots
    - default: tab dom contents
-->

<script lang="ts">
  import { getContext, onMount } from 'svelte';

// Props
export let label = '';
export let id = '';

// Get tabs context
const { tabs, content } = getContext('tabs');

// Add tab data to context
onMount(() => {
  if ($tabs && !$tabs.find((tab) => tab.id === id)) {
    $tabs = [
      ...$tabs,
      {
        label,
        id
      }
    ];
  }
});
</script>

<div class="has-js-only-block">
  <section {...$content(`tab-${id}`)} use:content id={`tab-${id}`}>
    <slot />
  </section>
</div>

<section class="no-js-only-block" id={`tab-${id}`}>
  <slot />
</section>
