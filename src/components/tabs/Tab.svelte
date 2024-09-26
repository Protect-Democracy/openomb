<!--
  Tab List Item
  Gets context from Tabs parent

  Params
    label: text for tab toggle element
  Slots
    - default: tab dom contents
-->

<script lang="ts">
  import { getContext } from 'svelte';

  const { tabs, content } = getContext('tabs');

  export let label = '';

  if (!!label && !$tabs.includes(label)) {
    $tabs = [...$tabs, label];
  }

  const tabIndex = $tabs.findIndex((t) => t === label);
</script>

<div class="has-js-only-block">
  <section {...$content(`tab-${tabIndex}`)} use:content id={`tab-${tabIndex}`}>
    <slot />
  </section>
</div>
<section class="no-js-only-block" id={`tab-${tabIndex}`}>
  <slot />
</section>
