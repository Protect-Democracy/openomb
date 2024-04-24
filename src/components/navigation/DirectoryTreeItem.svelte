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

  const {
    elements: { item, group },
    helpers: { isExpanded, isSelected }
  } = getContext<TreeView>('tree');

  const itemId = (Math.random() + 1).toString(36).substring(7);
  const hasChildren = !!$$slots.children;

  let iconDisplayProps = {};
  $: iconDisplayProps = $isSelected(itemId)
    ? {
        ['stroke-width']: 3
      }
    : {};
</script>

<li>
  <div class="item-title" class:selected={$isSelected(itemId)}>
    {#if hasChildren}
      <button
        class="like-text"
        {...$item({
          id: itemId,
          hasChildren
        })}
        use:item
      >
        <!-- Add icon. -->
        <div class="item-icon">
          {#if $isExpanded(itemId)}
            <MinusSquare {...iconDisplayProps} />
          {:else}
            <PlusSquare {...iconDisplayProps} />
          {/if}
        </div>
      </button>
      <slot name="title" />
      <slot />
    {:else}
      <div class="item-icon">
        <ArrowDownRight {...iconDisplayProps} />
      </div>
      <slot name="title" />
      <slot />
    {/if}
  </div>

  {#if hasChildren}
    <ul {...$group({ id: itemId })} use:group>
      <slot name="children" />
    </ul>
  {/if}
</li>

<style>
  ul {
    list-style: none;
  }

  .item-icon {
    margin-right: var(--spacing-half);
    height: var(--spacing);
    width: var(--spacing);
  }

  .item-title,
  button {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  [aria-expanded='true'] .item-icon {
    color: var(--color-orange);
  }

  .selected button {
    font-weight: 500;
  }
</style>
