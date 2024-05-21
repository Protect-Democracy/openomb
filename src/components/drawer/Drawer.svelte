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
  setContext('drawer', {
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
      class="drawer"
      transition:fly={{
        x: '-100%',
        duration: 300,
        opacity: 1
      }}
    >
      <div class="drawer-innder page-container">
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
            <slot name="title"><h2>{contentTitle}</h2></slot>
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

  .drawer {
    position: fixed;
    left: 0;
    top: 0;
    max-width: 75%;
    width: 100%;
    height: 100%;
    background-color: var(--color-background);
    z-index: 50;
    overflow-y: auto;
  }

  .close-button {
    position: absolute;
    right: var(--spacing);
    top: var(--spacing);
    color: var(--color-gray-dark);
    font-weight: var(--font-copy-weight-bolder);
  }

  .icon {
    display: inline-block;
    width: 0.9em;
    height: 0.9em;
    vertical-align: text-top;
  }

  @media (max-width: 768px) {
    .drawer {
      max-width: 100%;
    }
  }
</style>
