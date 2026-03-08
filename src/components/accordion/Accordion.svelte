<!--
  Accordion dropdown Element

  NOTE: This element acts more like a Dropdown for a single
  item, as opposed to a set of Dropdowns that open and close in
  relation to each other.

  TODO: Maybe rename as Dropdown.

  Params
    - id?: id of element (random default)
    - defaultOpen?: should accordion be open initially
  Slots
    - default or heading: item header/toggle
    - content: dropdown content
-->

<script lang="ts">
  import { createAccordion } from '@melt-ui/svelte';
  import { slide } from 'svelte/transition';
  import ChevronDown from '$components/icons/ChevronDown.svelte';

  export let id = (Math.random() + 1).toString(36).substring(7);
  export let defaultOpen = false;

  const {
    elements: { content, item, trigger, root },
    helpers: { isSelected }
  } = createAccordion({
    defaultValue: defaultOpen ? id : undefined
  });
</script>

<div class="accordion" {...$root}>
  <div class="accordion-item" {...$item(id)} use:item>
    <button class="like-text" {...$trigger(id)} use:trigger>
      <div class="heading">
        <slot />
        <slot name="heading" />
      </div>

      <div class="icon" class:selected={$isSelected(id)}>
        <ChevronDown />
      </div>
    </button>

    {#if $isSelected(id)}
      <div class="content" {...$content(id)} use:content transition:slide>
        <slot name="content" />
      </div>
    {/if}
  </div>
</div>

<style>
  button {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: flex-start;
    padding: calc(var(--spacing) * 1.25) var(--spacing) var(--spacing) 0;
  }

  button .icon {
    display: block;
    transition: 0.25s;
    width: var(--spacing);
  }

  button .icon.selected {
    transform: rotate(180deg);
  }

  .content {
    padding: 0 var(--spacing) var(--spacing);
  }

  [aria-expanded='true'] {
    padding-bottom: var(--spacing-half);
  }

  [aria-expanded='true'] .heading {
    color: var(--color-orange);
  }
</style>
