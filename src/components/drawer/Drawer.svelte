<script lang="ts">
  import { createDialog } from '@melt-ui/svelte';
  import { fade, fly } from 'svelte/transition';

  export let contentTitle = '';
  export let contentDescription = '';

  const {
    elements: { trigger, overlay, content, title, description, close, portalled },
    states: { open }
  } = createDialog({
    forceVisible: true
  });
</script>

<button {...$trigger} use:trigger>
  <slot name="trigger" />
</button>
{#if $open}
  <div class="" {...$portalled} use:portalled>
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
      <button {...$close} use:close aria-label="Close" class="close-icon"> X </button>
      {#if contentTitle.length || !!$$slots.title}
        <h2 {...$title} use:title>
          <slot name="title">{contentTitle}</slot>
        </h2>
      {/if}
      {#if contentDescription.length || !!$$slots.description}
        <p {...$description} use:description class="mb-5 mt-2 leading-normal text-zinc-600">
          <slot name="description">{contentDescription}</slot>
        </p>
      {/if}
      <section>
        <slot name="content" />
      </section>
    </div>
  </div>
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

  .drawer h2 {
    margin: 0 var(--spacing) var(--spacing);
    text-align: center;
  }

  .close-icon {
    position: absolute;
    right: var(--spacing);
    top: var(--spacing);
    min-width: 0;
    padding: var(--spacing-half) var(--spacing);
  }
</style>
