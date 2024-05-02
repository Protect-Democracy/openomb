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
  import { setContext, type Action } from 'svelte';

  // Props
  export let columns = 1;

  // Context
  const treeContext = createTreeView();
  setContext('tree', treeContext);

  // Constants
  const {
    elements: { tree }
  } = treeContext;

  // Action to adjust our element styles and force correct column breaks
  const preventColumnShift: Action<HTMLUListElement> = (node) => {
    const children = node.querySelectorAll(':scope > li');
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
      // Firefox does not support break-before in columns
      // Prevent from breaking within column element at least
      Object.assign(item.style, {
        'break-inside': 'avoid-column',
        '-webkit-column-break-inside': 'avoid-column'
      });
      lastTop = item.offsetTop;
    });
  };
</script>

<ul {...$tree} class={`columns-${columns}`} use:preventColumnShift>
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
