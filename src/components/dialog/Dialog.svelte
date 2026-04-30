<script lang="ts">
  import { createDialog } from '@melt-ui/svelte';
  import { fade, fly } from 'svelte/transition';
  import XSymbol from '$components/icons/XSymbol.svelte';
  import { setContext } from 'svelte';

  // Allow for easy title and description without slots
  export let contentTitle = '';
  export let contentDescription = '';
  export let triggerProps = {};

  const {
    elements: { trigger, overlay, content, title, description, close, portalled },
    states: { open }
  } = createDialog({
    forceVisible: true
  });

  // Context to allow for closing
  setContext('dialog', {
    close: () => {
      open.set(false);
    }
  });
</script>

<button {...$trigger} use:trigger {...triggerProps}>
  <slot name="trigger" />
</button>

{#if $open}
  <aside {...$portalled} use:portalled>
    <div {...$overlay} use:overlay class="wrapper" transition:fade={{ duration: 150 }}></div>
    <div
      {...$content}
      use:content
      class="dialog"
      transition:fly={{
        duration: 300,
        opacity: 1
      }}
    >
      <div class="dialog-inner">
        <button
          {...$close}
          use:close
          aria-label="Close"
          class="small compact like-text close-button"
        >
          <span class="icon"><XSymbol /></span>
        </button>

        {#if contentTitle.length || !!$$slots.title}
          <div {...$title} use:title>
            <slot name="title"><h2 class="h3">{contentTitle}</h2></slot>
          </div>
        {/if}

        {#if contentDescription.length || !!$$slots.description}
          <div {...$description} use:description>
            <slot name="description"><p>{contentDescription}</p></slot>
          </div>
        {/if}

        <section>
          <slot name="content" />
        </section>
      </div>
    </div>
  </aside>
{/if}

<style>
  .wrapper {
    position: fixed;
    inset: 0;
    background-color: var(--color-gray-dark);
    z-index: 50;
    opacity: 0.75;
  }

  .dialog {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    min-height: 20vh;
    max-height: 85vh;
    width: 85vw;
    max-width: calc(var(--copy-width-limit) + var(--spacing) * 5);
    background-color: var(--color-background);
    z-index: 50;
    box-shadow: var(--drop-shadow);
    padding: calc(var(--spacing) * 4) calc(var(--spacing) * 8);
    border: var(--border-weight) solid var(--color-text);
    border-radius: 0;

    @media (max-width: 900px) {
      & {
        padding: calc(var(--spacing) * 3) calc(var(--spacing) * 3);
      }
    }

    @media (max-width: 550px) {
      & {
        padding: calc(var(--spacing) * 2) calc(var(--spacing) * 2);
      }
    }
  }

  .close-button {
    position: absolute;
    right: var(--spacing);
    top: var(--spacing);
    color: var(--color-text);
    font-weight: var(--font-copy-weight-bolder);

    @media (max-width: 550px) {
      & {
        right: var(--spacing-half);
        top: var(--spacing-half);
      }
    }
  }

  .icon {
    display: inline-block;
    width: 0.9em;
    height: 0.9em;
    vertical-align: text-top;
  }
</style>
