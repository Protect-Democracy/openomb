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
  import { setContext } from 'svelte';
  import DirectoryTreeItem from '$components/navigation/DirectoryTreeItem.svelte';

  const treeContext = createTreeView();
  setContext('tree', treeContext);

  const {
    elements: { tree },
  } = treeContext;
</script>

<ul {...$tree}>
  <slot />
</ul>

<style>
  ul {
    list-style: none;
  }
</style>
