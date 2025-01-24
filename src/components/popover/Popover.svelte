<script lang="ts">
  import { createPopover, createSync } from '@melt-ui/svelte';
  import { fade } from 'svelte/transition';
  import XSymbol from '$components/icons/XSymbol.svelte';
  import QuestionMark from '$components/icons/QuestionMark.svelte';

  export let open = false;
  export let triggerLabel = 'Open';

  const {
    elements: { trigger, content, arrow, close },
    states
  } = createPopover({});

  const sync = createSync(states);
  $: sync.open(open, (v) => (open = v));

  console.dir(arrow);
  console.dir(trigger);
  console.dir(content);
</script>

<button {...trigger} use:trigger type="button" class="trigger like-text" aria-label={triggerLabel}>
  <span class="icon"><QuestionMark /></span>
</button>

{#if open}
  <div {...content} use:content transition:fade={{ duration: 100 }} class="content">
    <div {...arrow} use:arrow class="arrow"></div>
    <div class="">
      <button {...close} use:close class="close like-text" aria-label="Close">
        <span class="icon"><XSymbol /></span>
      </button>

      <slot />
    </div>
  </div>
{/if}

<style>
  .content {
    background-color: var(--color-background);
    padding: var(--spacing);
    border-radius: var(--border-radius);
    max-width: calc(var(--spacing) * 30);
    box-shadow: var(--drop-shadow);
  }

  .arrow {
    position: absolute;
    width: var(--arrow-size, 8px);
    height: var(--arrow-size, 8px);
    transform: rotate(45deg);
    background-color: inherit;
    z-index: inherit;
    left: calc(50% - var(--arrow-size, 8px) / 2);
    bottom: calc(100% - var(--arrow-size, 8px) / 2);

    [data-side='top'] & {
      left: calc(50% - var(--arrow-size, 8px) / 2);
      bottom: calc(0% - var(--arrow-size, 8px) / 2);
    }

    [data-side='left'] & {
      left: calc(100% - var(--arrow-size, 8px) / 2);
      bottom: calc(50% - var(--arrow-size, 8px) / 2);
    }

    [data-side='right'] & {
      left: calc(0% - var(--arrow-size, 8px) / 2);
      bottom: calc(50% - var(--arrow-size, 8px) / 2);
    }
  }

  .close {
    float: right;
  }

  .icon {
    display: inline-block;
    width: 1.1em;
    height: 1.1em;
    vertical-align: text-top;
  }

  .content .icon {
    width: 0.8em;
    height: 0.8em;
  }
</style>
