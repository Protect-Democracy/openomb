<script lang="ts">
  import '@fontsource/domine/';
  import '@fontsource/domine/600.css';
  import '@fontsource/ibm-plex-sans';
  import '@fontsource/ibm-plex-sans/400.css';
  import '@fontsource/ibm-plex-sans/600.css';
  import '@fontsource/ibm-plex-sans/700.css';
  import { onMount } from 'svelte';
  import { derived } from 'svelte/store';
  import { page } from '$app/stores';
  import { isProduction } from '$lib/utilities';
  import { formatJsonLdScript, pageSchema } from '$lib/schema';
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
    socialTwitterImgPath,
    googleAnalyticsId
  } from '$config';
  import pdLogo from '$assets/logos/pd-white-words-logo.svg';
  import favAppleTouch from '$assets/favicon/apple-touch-icon.png';
  import fav16 from '$assets/favicon/favicon-16x16.png';
  import fav32 from '$assets/favicon/favicon-32x32.png';
  import favIco from '$assets/favicon/favicon.ico';
  import favSafari from '$assets/favicon/safari-pinned-tab.svg';

  // Styles
  import '../styles/index.css';

  // Constants
  const pageMeta = derived(page, ($page) => $page.data?.pageMeta || {});
  const url = derived(page, ($page) => $page.url);
  // TODO: Update this when ready to not have development notice
  const productionCheck = false; // !isProduction()

  // On Mount
  onMount(() => {
    if (googleAnalyticsId && typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', googleAnalyticsId);
    }
  });
</script>

<svelte:head>
  <!-- Unsure why this throws an error since it works.  See: https://github.com/sveltejs/eslint-plugin-svelte/issues/652 -->
  <!-- eslint-disable svelte/valid-compile -->
  <title>{$pageMeta.title ? `${$pageMeta.title} | ` : ''}{siteName}</title>

  <meta name="author" content={$pageMeta.author || siteAuthor} />
  <meta name="description" content={$pageMeta.description || siteDescription} />
  <meta name="keywords" content={($pageMeta.keywords || siteKeywords).join(',')} />

  <link rel="icon" type="image/png" sizes="32x32" href={fav32} />
  <link rel="icon" type="image/png" sizes="16x16" href={fav16} />
  <link rel="apple-touch-icon" sizes="180x180" href={favAppleTouch} />
  <link rel="manifest" href="/site.webmanifest" />
  <link rel="mask-icon" href={favSafari} color="#5bbad5" />
  <link rel="shortcut icon" href={favIco} />
  <meta name="msapplication-TileColor" content="#ffc40d" />
  <meta name="msapplication-config" content="/browserconfig.xml" />
  <meta name="theme-color" content="#ffffff" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="{deployedBaseUrl}{$url.pathname}" />
  <meta property="og:title" content={$pageMeta.title || siteName} />
  <meta property="og:description" content={$pageMeta.description || siteDescription} />
  <meta property="og:site_name" content={siteName} />
  <meta property="og:image" content="{deployedBaseUrl}{$pageMeta.ogImgPath || socialOgImgPath}" />
  <meta property="og:image:width" content={($pageMeta.ogImgWidth || socialOgImgWidth).toString()} />
  <meta
    property="og:image:height"
    content={($pageMeta.ogImgHeight || socialOgImgHeight).toString()}
  />

  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html formatJsonLdScript($pageMeta?.schema || pageSchema($pageMeta))}

  <meta name="twitter:card" content={socialTwitterCard} />
  <meta name="twitter:site" content={socialTwitterSite} />
  <meta name="twitter:creator" content={socialTwitterCreator} />
  <meta name="twitter:title" content={$pageMeta.title || siteName} />
  <meta name="twitter:description" content={$pageMeta.description || siteDescription} />
  <meta
    name="twitter:image"
    content="{deployedBaseUrl}{$pageMeta.twitterImgPath || socialTwitterImgPath}"
  />

  {#if googleAnalyticsId}
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-Y5NJ2S21X5"></script>
  {/if}
</svelte:head>

<div class="visually-hidden-focusable">
  <a href="#main-content">Skip to main content</a>
</div>

{#if !productionCheck}
  <div class="development">
    <p>
      You are currently viewing a <strong>development version</strong> of this site and it may be inaccurate.
    </p>
  </div>
{/if}

<header>
  <div class="page-container">
    <div class="header-inner">
      <h1><a href="/">{siteName}</a></h1>

      <nav>
        <a class:active={$url.pathname === '/search'} href="/search">Search</a>
        <a class:active={$url.pathname === '/explore'} href="/explore">Explore</a>
        <a class:active={$url.pathname === '/faq'} href="/faq">FAQ</a>
        <a class:active={$url.pathname === '/about'} href="/about">About</a>
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
      </ul>
    </div>
  </div>

  <div class="attribution page-container">
    <p class="center-container">
      This website is not affiliated with the White House Office of Management and Budget (OMB) or
      any agency of the U.S. government. {siteName} is a searchable database maintained by
      <a
        href="https://protectdemocracy.org/"
        class="like-text"
        target="_blank"
        rel="noopener noreferrer">Protect Democracy</a
      >.
    </p>

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
    font-size: var(--font-size-small);
  }

  footer .attribution p {
    margin-bottom: var(--spacing-double);
  }

  footer .attribution a.like-text {
    color: var(--color-text-inverse);
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

  footer .attribution li a {
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

  @media (max-width: 768px) {
    nav a {
      margin-left: var(--spacing);
    }
  }
</style>
