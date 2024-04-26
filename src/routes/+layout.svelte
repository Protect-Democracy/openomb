<script lang="ts">
  import '@fontsource/domine/';
  import '@fontsource/domine/600.css';
  import '@fontsource/ibm-plex-sans';
  import '@fontsource/ibm-plex-sans/400.css';
  import '@fontsource/ibm-plex-sans/600.css';
  import '@fontsource/ibm-plex-sans/700.css';
  import { page } from '$app/stores';
  import { isProduction } from '$lib/utilities';
  import {
    siteName,
    siteAuthor,
    siteDescription,
    siteKeywords,
    deployedBaseUrl,
    socialOgImgPath,
    socialOgImgWidth,
    socialOgImgHeight,
    socialTwitterCard,
    socialTwitterSite,
    socialTwitterCreator,
    socialTwitterImgPath
  } from '$config';
  import favicon from '$assets/favicon/favicon.png';
  import pdLogo from '$assets/logos/pd-white-words-logo.svg';
  import '../styles/index.css';

  const sentryScript = import.meta.env.VITE_SENTRY_SCRIPT;
</script>

<svelte:head>
  <!-- Unsure why this throws an error since it works.  See: https://github.com/sveltejs/eslint-plugin-svelte/issues/652 -->
  <!-- eslint-disable svelte/valid-compile -->
  <title>{$page.data?.pageMeta?.title ? `${$page.data?.pageMeta?.title} | ` : ''}{siteName}</title>

  <link rel="icon" href={favicon} />

  <meta name="author" content={$page.data?.pageMeta?.author || siteAuthor} />
  <meta name="description" content={$page.data?.pageMeta?.description || siteDescription} />
  <meta name="keywords" content={($page.data?.pageMeta?.keywords || siteKeywords).join(',')} />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="{deployedBaseUrl}{$page.url.pathname}" />
  <meta property="og:title" content={$page.data?.pageMeta?.title || siteName} />
  <meta property="og:description" content={$page.data?.pageMeta?.description || siteDescription} />
  <meta property="og:site_name" content={siteName} />
  <meta
    property="og:image"
    content="{deployedBaseUrl}{$page.data?.pageMeta?.ogImgPath || socialOgImgPath}"
  />
  <meta
    property="og:image:width"
    content={($page.data?.pageMeta?.ogImgWidth || socialOgImgWidth).toString()}
  />
  <meta
    property="og:image:height"
    content={($page.data?.pageMeta?.ogImgHeight || socialOgImgHeight).toString()}
  />

  <meta name="twitter:card" content={socialTwitterCard} />
  <meta name="twitter:site" content={socialTwitterSite} />
  <meta name="twitter:creator" content={socialTwitterCreator} />
  <meta name="twitter:title" content={$page.data?.pageMeta?.title || siteName} />
  <meta name="twitter:description" content={$page.data?.pageMeta?.description || siteDescription} />
  <meta
    name="twitter:image"
    content="{deployedBaseUrl}{$page.data?.pageMeta?.twitterImgPath || socialTwitterImgPath}"
  />
  <!-- eslint-enable svelte/valid-compile -->

  {#if sentryScript}
    <!-- Temporary use of Sentry browser integration -->
    <script src={sentryScript} crossorigin="anonymous"></script>
    <script nonce="SENTRY_SCRIPT_SETUP">
      window.sentryOnLoad = function () {
        Sentry.init({
          // Unsure how to put Svelte variables in here
          environment: window.location.hostname.match(/apportionment/)
            ? 'production'
            : 'development'
        });
      };
    </script>
  {/if}
</svelte:head>

<div class="visually-hidden-focusable">
  <a href="#main-content">Skip to main content</a>
</div>

{#if !isProduction()}
  <div class="development">
    <p>
      You are currently viewing a <strong>development version</strong> of this site and it may be inaccurate.
    </p>
  </div>
{/if}

<header>
  <div class="page-container">
    <div class="header-inner">
      <h1><a href="/">Apportionments</a></h1>

      <nav>
        <a class:active={$page.url.pathname === '/search'} href="/search">Search</a>
        <a class:active={$page.url.pathname === '/explore'} href="/explore">Explore</a>
        <a class:active={$page.url.pathname === '/faq'} href="/faq">FAQ</a>
        <a class:active={$page.url.pathname === '/about'} href="/about">About</a>
        {#if !isProduction()}
          <a href="/examples">Examples</a>
        {/if}
      </nav>
    </div>
  </div>
</header>

<main id="main-content">
  <slot />
</main>

<footer>
  <div class="links">
    <div class="page-container">
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/developers">For developers</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </div>
  </div>

  <div class="attribution page-container">
    <p class="center-container">{siteName} is a project of</p>

    <ul>
      <li>
        <a href="https://protectdemocracy.org/" target="_blank" rel="noopener noreferrer"
          ><img src={pdLogo} alt="Protect Democracy logo" /></a
        >
      </li>
    </ul>
  </div>
</footer>

<style>
  header {
    border-bottom: var(--border-weight) solid var(--color-black);
  }

  .header-inner {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-content: center;
    padding: var(--spacing-double) 0;
  }

  h1 {
    font-size: 1.25rem;
    padding: 0;
    margin: 0;
  }

  h1 a {
    color: var(--color-text);
  }

  nav {
    padding: 0;
  }

  nav a {
    color: var(--color-text);
    margin-left: var(--spacing-double);
    font-weight: var(--font-copy-weight-bolder);
  }

  nav a.active {
    text-decoration: underline;
  }

  main {
    min-height: 60vh;
  }

  footer {
    background-color: var(--color-background-inverse);
    color: var(--color-text-inverse);
    padding: 0;
    margin: 0;
  }

  footer .links {
    text-align: center;
    padding: calc(var(--spacing) * 3) 0;
    border-bottom: var(--border-weight-thin) solid var(--color-text-inverse);
  }

  footer .links ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    gap: var(--spacing-large);
  }

  footer .links li {
    display: block;
    margin: 0;
    padding: 0;
  }

  footer .links a {
    color: var(--color-text-inverse);
    font-weight: var(--font-copy-weight-bold);
  }

  footer .attribution {
    padding-top: var(--spacing-double);
    padding-bottom: var(--spacing-large);
    text-align: center;
  }

  footer .attribution p {
    margin-bottom: var(--spacing-double);
  }

  footer .attribution ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    gap: var(--spacing-large);
  }

  footer .attribution li {
    display: block;
    margin: 0;
    padding: 0;
  }

  footer .attribution a {
    display: block;
    max-width: 15rem;
  }

  .development {
    padding: var(--spacing);
    background: var(--color-highlight);
    width: 100%;
  }

  .development p {
    margin: 0 auto;
    text-align: center;
  }
</style>
