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

<div
  {...$root}
  use:root
  class="page-container tab-menu"
  class:has-tabs={typeof $tabs !== 'undefined' && $tabs.length}
>
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
    margin: var(--spacing-double) 0 var(--spacing) 0;
    border-bottom: var(--border-weight) solid var(--color-toggle-on);
    padding: 0 var(--spacing);
    display: none;
  }

  .has-tabs .tab-list {
    display: block;
  }

  .tab-list .trigger {
    background: transparent;
    padding: var(--spacing-half) var(--spacing-double);
    margin: 0 var(--spacing-thin);
    min-width: unset;
    background-color: var(--color-background);
    color: var(--color-text);
    transition: var(--transition);
    border-radius: var(--border-radius) var(--border-radius) 0 0;

    &[data-state='active'] {
      background-color: var(--color-toggle-on);
      color: var(--color-toggle-on-text);
    }

    &[data-state='inactive']:hover {
      background-color: var(--color-gray-lighter);
      color: var(--color-text);
    }
  }
</style>
