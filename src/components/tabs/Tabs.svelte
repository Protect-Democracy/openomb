<!--
  Wrapper for Tab List
  Expects Tab(s) as children

  Params
    None
  Slots
    - default: nested Tab elements
-->

<script lang="ts">
  import { createTabs } from '@melt-ui/svelte';
  import { writable } from 'svelte/store';
  import { setContext } from 'svelte';

  const {
    elements: { root, list, content, trigger }
  } = createTabs({
    defaultValue: 'tab-0'
  });

  let tabs = writable([]);

  let tabContext = { tabs, content };
  setContext('tabs', tabContext);
</script>

<div {...$root} use:root class="page-container tab-menu">
  <div {...$list} use:list class="tab-list">
    {#each $tabs as tab, index}
      <button {...$trigger(`tab-${index}`)} use:trigger class="trigger relative">
        {tab}
      </button>
    {/each}
  </div>
  <slot />
</div>

<style>
  .tab-list {
    background: var(--color-background-alt);
    margin: var(--spacing) 0;
  }

  .tab-menu .trigger {
    background: transparent;
    color: var(--color-text);
    padding: var(--spacing-half) var(--spacing-double);
    margin: 0;
    min-width: unset;
    border-top: 1px solid var(--color-gray-light);
    border-right: 1px solid var(--color-gray-light);
    border-left: 1px solid var(--color-gray-light);
    border-radius: 0 var(--border-radius) 0 0;
  }

  .tab-menu .trigger[data-state='active'] {
    background-color: var(--color-background);
  }
</style>
