<!--
  Wrapper for Directory Tree Navigation
  Expects DirectoryTreeItem(s) as children

  Params
    None
  Slots
    - default: navigation items
-->

<script lang="ts">
  import { createTreeView } from '@melt-ui/svelte';
  import { setContext, onMount } from 'svelte';

  // Props
  export let columns = 1;

  // State
  let listEl: HTMLUListElement;

  // Context
  const treeContext = createTreeView();
  setContext('tree', treeContext);

  // Constants
  const {
    elements: { tree }
  } = treeContext;

  // Mounting
  onMount(() => {
    // CSS columns are what we want, but unfortunately they reflow
    // the content when an item is expanded.  We work around this,
    // by looking at all the top-level items to see which ones are
    // at the top and then mark it in css.
    const children = listEl.querySelectorAll(':scope > li');
    let lastTop = 0;
    [...children].forEach((item) => {
      if (item.offsetTop < lastTop) {
        Object.assign(item.style, {
          'column-break-before': 'always',
          '--webkit-column-break-before': 'always',
          'break-before': 'column',
          '--webkit-break-before': 'column'
        });
      }
      lastTop = item.offsetTop;
    });
  });
</script>

<ul {...$tree} class={`columns-${columns}`} bind:this={listEl}>
  <slot />
</ul>

<style>
  ul {
    list-style: none;
    margin: 0 0 var(--spacing-double) 0;
    padding: 0;
  }

  ul.columns-2 {
    columns: 2;
    gap: 0 var(--spacing-large);
  }
</style>
