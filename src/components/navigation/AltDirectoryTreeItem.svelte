<!--
  Directory Tree Navigation Item
  Gets context from DirectoryTree parent

  Params
    None
  Slots
    - default or title: item label
    - children: nested navigation items (optional)
-->

<script lang="ts">
  import { type TreeView } from '@melt-ui/svelte';
import { getContext } from 'svelte';
import PlusSquare from '$components/icons/PlusSquare.svelte';
import MinusSquare from '$components/icons/MinusSquare.svelte';
import ArrowDownRight from '$components/icons/ArrowDownRight.svelte';

// Props
export let level: number;

// Get context from the top-level parent "tree"
const {
  elements: { item, group },
  helpers: { isExpanded, isSelected }
} = getContext<TreeView>('tree');

// Constants
const itemId = (Math.random() + 1).toString(36).substring(7);
const hasChildren = !!$$slots.default;

// Derived
let iconDisplayProps = {};
$: iconDisplayProps = {
  ['stroke-width']: $isSelected(itemId) ? 3 : 2
};
</script>

<li class={`level-${level} clearfix`}>
  <div class="item-title" class:selected={$isSelected(itemId)}>
    {#if hasChildren}
      <button
        class="like-text compact"
        {...$item({
          id: itemId,
          hasChildren
        })}
        use:item
      >
        <div class="item-icon with-children">
          {#if $isExpanded(itemId)}
            <MinusSquare {...iconDisplayProps} />
          {:else}
            <PlusSquare {...iconDisplayProps} />
          {/if}
        </div>

        <span class="button-content">
          <span class="sr-only">{$isExpanded(itemId) ? 'Collapse' : 'Expand'}</span>

          <slot name="button" />
        </span>
      </button>

      <slot name="title" />

      {#if $$slots.hover}
        <span class="hover-content">
          <slot name="hover" />
        </span>
      {/if}
    {:else}
      <div class="item-icon no-children">
        <ArrowDownRight {...iconDisplayProps} />
      </div>

      <slot name="title" />

      {#if $$slots.hover}
        <span class="hover-content">
          <slot name="hover" />
        </span>
      {/if}
    {/if}
  </div>

  {#if hasChildren}
    <ul {...$group({ id: itemId })} use:group>
      <slot />
    </ul>
  {/if}
</li>

<style>
  li {
    padding: 0;
    margin-bottom: var(--spacing-thin);
  }

  ul {
    list-style-type: none;
    padding: var(--spacing-half) var(--spacing) var(--spacing-thin) var(--spacing);
    margin: 0;
  }

  .item-title {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-half);
  }

  button {
    transition: color var(--transition);
  }

  button:hover {
    color: var(--color-orange);
  }

  .item-icon {
    height: var(--spacing);
    width: var(--spacing);
    min-width: var(--spacing);
    display: inline-block;
    vertical-align: text-top;
    margin: var(--spacing-thin) 0 0 0;
    padding: 0;
  }

  button,
  .item-icon.no-children {
    padding: 0;
    margin: 0;
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-half);
  }

  [aria-expanded='true'] .item-icon {
    color: var(--color-orange);
  }

  .hover-content {
    opacity: 0;
    transition: all var(--transition-fast);
  }

  .item-title:hover .hover-content {
    opacity: 1;
  }

  .hover-content:has(*:focus) {
    opacity: 1;
  }

  li.level-1 {
    border-bottom: var(--border-weight) solid var(--color-black);
    padding: var(--spacing) 0;
    margin: 0;
  }
</style>
