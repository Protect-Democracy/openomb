<!--
  Dropdown Navigation Menu

  Params
    - title: Main toggle link text
    - fallbackHref: If javascript is disabled, the href that the toggle will navigate to
    - links: Array of link items (eg: [{ title: 'Link name' , href: '/url' }])
  Slots
    None
-->

<script lang="ts">
  import { createDropdownMenu } from '@melt-ui/svelte';
  import { derived } from 'svelte/store';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // Props
  export let title = '';
  export let fallbackHref = '';
  export let links = [];

  const url = derived(page, ($page) => $page.url);
  const {
    elements: { menu, item, trigger, arrow }
  } = createDropdownMenu();
</script>

<button class="like-text dropdown-toggle has-js-only-inline" {...$trigger} use:trigger tabindex="0"
  >{title}</button
>
<div {...$menu} use:menu class="dropdown-menu">
  {#each links as link}
    <div
      {...$item}
      use:item
      class="menu-item"
      on:m-click={() => goto(link.href, { noScroll: false })}
      aria-label={link.title}
    >
      <a class:active={$url.pathname === link.href} href={link.href}>{link.title}</a>
    </div>
  {/each}
  <div {...$arrow} use:arrow></div>
</div>

{#if fallbackHref}
  <a class="no-js-only-inline" class:active={$url.pathname === fallbackHref} href={fallbackHref}
    >{title}</a
  >
{/if}

<style>
  button.like-text,
  a {
    color: var(--color-text);
    font-weight: var(--font-copy-weight-bolder);
  }

  a.active {
    text-decoration: underline;
  }

  .dropdown-menu {
    background: var(--color-background);
  }

  .menu-item {
    padding: var(--spacing-half);
  }
</style>
