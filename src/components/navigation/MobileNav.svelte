<!--
  Mobile Navigation

  Slide-in navigation panel for small screens, using the checkbox hack
  so it works without JavaScript.

  Usage:
    <MobileNav {url} {productionCheck} />
-->

<script lang="ts">
  import { page } from '$app/stores';
  import { afterNavigate } from '$app/navigation';
  import { derived } from 'svelte/store';
  import Hamburger from '$components/icons/Hamburger.svelte';
  import XSymbol from '$components/icons/XSymbol.svelte';
  import UserWrapper from '$components/subscriptions/UserWrapper.svelte';

  const url = derived(page, ($page) => $page.url);

  // Props
  export let productionCheck: boolean = true;

  // Close the menu after client-side navigation
  afterNavigate(() => {
    const toggle = document.getElementById('mobile-nav-toggle') as HTMLInputElement | null;
    if (toggle) {
      toggle.checked = false;
    }
  });
</script>

<div class="mobile-nav">
  <!-- Checkbox drives open/close state without JS -->
  <input type="checkbox" id="mobile-nav-toggle" class="toggle-input" aria-hidden="true" />

  <label for="mobile-nav-toggle" class="hamburger-button" aria-label="Open menu">
    <span class="icon"><Hamburger /></span>
  </label>

  <!-- Backdrop closes menu when tapped -->
  <label for="mobile-nav-toggle" class="backdrop" aria-hidden="true"></label>

  <nav class="panel" aria-label="Mobile navigation">
    <label for="mobile-nav-toggle" class="close-button" aria-label="Close menu">
      <span class="icon"><XSymbol /></span>
    </label>

    <ul>
      <li>
        <a class:active={$url.pathname === '/search'} href="/search">Search</a>
      </li>
      <li>
        <a class:active={$url.pathname === '/explore'} href="/explore">All Agencies</a>
      </li>
      <li>
        <a class:active={$url.pathname === '/folders'} href="/folders">CFO/CIO Act Agencies</a>
      </li>
      <li>
        <a class:active={$url.pathname === '/faq'} href="/faq">FAQ</a>
      </li>
      <li>
        <a class:active={$url.pathname === '/about'} href="/about">About</a>
      </li>

      {#if !productionCheck}
        <li>
          <a href="/examples">Examples</a>
        </li>
      {/if}

      <li>
        <UserWrapper>
          <a class="button compact" href="/subscribe">Account</a>

          <span slot="no-user">
            <a class="button compact" href="/subscribe">Log in</a>
          </span>

          <span slot="before-check">
            <a class="button compact" href="/subscribe">Log in</a>
          </span>
        </UserWrapper>
      </li>
    </ul>
  </nav>
</div>

<style>
  .mobile-nav {
    display: none;
  }

  /* Only show on small screens */
  @media (max-width: 768px) {
    .mobile-nav {
      display: block;
    }
  }

  .toggle-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .hamburger-button {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-half);
    color: var(--color-text);
  }

  .hamburger-button .icon {
    display: block;
    width: 1.5rem;
    height: 1.5rem;
  }

  /* Backdrop overlay behind the panel */
  .backdrop {
    position: fixed;
    inset: 0;
    background-color: var(--color-gray-dark);
    opacity: 0;
    z-index: 49;
    pointer-events: none;
    transition: opacity var(--transition);
  }

  .panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 75%;
    max-width: 20rem;
    height: 100%;
    background-color: var(--color-background);
    z-index: 50;
    transform: translateX(100%);
    transition: transform var(--transition);
    overflow-y: auto;
    padding: var(--spacing-double) var(--spacing);
    box-shadow: var(--drop-shadow);
  }

  /* When checkbox is checked, show the panel and backdrop */
  .toggle-input:checked ~ .backdrop {
    opacity: 0.75;
    pointer-events: auto;
  }

  .toggle-input:checked ~ .panel {
    transform: translateX(0);
  }

  .close-button {
    cursor: pointer;
    display: block;
    text-align: right;
    margin-bottom: var(--spacing-double);
    color: var(--color-gray-dark);
  }

  .close-button .icon {
    display: inline-block;
    width: 0.9rem;
    height: 0.9rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    margin: 0;
    padding: 0;
  }

  li a {
    display: block;
    padding: var(--spacing-half) var(--spacing-half);
    color: var(--color-text);
    font-weight: var(--font-copy-weight-bolder);
    font-size: var(--font-size-slight);
    text-decoration: none;
  }

  li a.active {
    text-decoration: underline;
  }

  li a.button {
    display: inline-block;
    margin-top: var(--spacing-half);
    font-size: 1rem;
    color: var(--color-primary-text);
    font-weight: var(--font-copy-weight-bold);
  }
</style>
