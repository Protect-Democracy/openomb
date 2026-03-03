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

  // TODO: Ideally we could keep the default tab in the URL,
  // but there are two issues to figure out:
  // 1) If the hash is the same as something else, it will scroll
  //    to that place, which is a bit unexpected when changing tabs
  // 2) For some reason the non default content doesn't show up
  //    if there is a hash set on the page load.  For instance,
  //    setting to #account-results on the search page, the results
  //    don't show up initially but will after clicking other tab

  // Props
  export let defaultTabId: string;

  // Setup tabs parts from MeltUI
  const {
    elements: { root, list, content, trigger }
  } = createTabs({
    defaultValue: `tab-${defaultTabId}`
  });

  // Setup tab context to keep track of tabs and content
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
    {#each $tabs as tab}
      <button {...$trigger(`tab-${tab.id}`)} use:trigger class="trigger relative">
        {tab.label}
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
