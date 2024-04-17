<!--
  Accordion dropdown Element

  Params
    - id?: id of element (random default)
    - defaultOpen?: should accordion be open initially
  Slots
    - default or heading: item header/toggle
    - content: dropdown content
-->

<script lang="ts">
  import { createAccordion, melt } from '@melt-ui/svelte';
  import { slide } from 'svelte/transition';
  import ChevronDown from '$components/icons/ChevronDown.svelte';

  export let id = (Math.random() + 1).toString(36).substring(7);
  export let defaultOpen = false;

  const {
    elements: { content, item, trigger, root },
    helpers: { isSelected },
  } = createAccordion({
    defaultValue: defaultOpen ? id : undefined,
  });
</script>

<div class="accordion" {...$root}>
  <div class="accordion-item" {...$item(id)} use:item>
    <button class="heading" {...$trigger(id)} use:trigger>
      <div>
        <slot /><slot name="heading" />
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
  button.heading {
    background: none;
    color: var(--color-text);
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: var(--spacing);
  }
  .heading .icon {
    display: inline-block;
    transition: .25s;
  }
  .heading .icon.selected {
    transform: rotate(180deg);
  }

  .content {
    padding: 0 var(--spacing) var(--spacing);
  }
</style>
