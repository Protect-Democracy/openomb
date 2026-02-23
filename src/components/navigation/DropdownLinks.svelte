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
import ChevronDown from '$components/icons/ChevronDown.svelte';

// Props
export let title = '';
export let fallbackHref = '';
export let links: { title: string; href: string }[] = [];

const url = derived(page, ($page) => $page.url);
const {
  elements: { menu, item, trigger, arrow }
} = createDropdownMenu();
</script>

<button class="like-text dropdown-toggle has-js-only-inline" {...$trigger} use:trigger tabindex="0">
  {title}
  <span class="inline-icon"><ChevronDown /></span>
</button>

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
    z-index: 100;
    background: var(--color-background);
    box-shadow: var(--drop-shadow);
    border-radius: var(--border-radius-small);
    border: var(--border-weight-thin) solid var(--color-gray-medium);

    & [data-arrow='true'][data-side='bottom'] {
      border-top: var(--border-weight-thin) solid var(--color-gray-medium);
      border-left: var(--border-weight-thin) solid var(--color-gray-medium);
    }
  }

  .menu-item {
    padding: var(--spacing-half);
    text-align: center;

    a {
      font-size: var(--font-size-small);
    }
  }

  button .inline-icon {
    margin-left: var(--spacing-small);
    margin-right: 0;
    display: inline-block;
    margin-top: var(--spacing-small);
    transition: var(--transition);
  }
  button[aria-expanded='true'] .inline-icon {
    transform-origin: 50% 40%;
    transform: rotate(180deg);
  }
</style>
