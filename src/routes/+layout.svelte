<script lang="ts">
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
  import '../app.css';
</script>

<svelte:head>
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
</svelte:head>

<div class="visually-hidden-focusable">
  <a href="#main-content">Skip to main content</a>
</div>

<header>
  {#if !isProduction()}
    <div class="development">
      <p>
        You are currently viewing a <strong>development version</strong> of this site and it may be inaccurate.
      </p>
    </div>
  {/if}

  <h1><a href="/">Apportionments</a></h1>

  <nav>
    <a href="/search">Search</a>
    <a href="/agency">Directory</a>
    <a href="/faq">Apportionments FAQ</a>
    <a href="/about">About</a>
    {#if !isProduction()}
      <a href="/examples">Examples</a>
    {/if}
  </nav>
</header>

<main id="main-content">
  <slot />
</main>

<footer>
  <ul>
    <li><a href="/about">About</a></li>
    <li><a href="/developers">For developers</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>

  <div>
    <p>{siteName} is a project of</p>
    <ul>
      <li>
        <a href="https://protectdemocracy.org/" target="_blank" rel="noopener noreferrer"
          >Protect Democracy</a
        >
      </li>
    </ul>
  </div>
</footer>

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-content: center;
    padding: var(--spacing) var(--spacing-large);
  }

  h1 {
    font-size: 1.25rem;
    padding: var(--spacing) 0;
    margin: 0;
  }

  h1 a {
    color: var(--color-text);
  }

  nav {
    padding: var(--spacing) 0;
  }

  nav a {
    color: var(--color-text);
    margin-left: var(--spacing-double);
    font-weight: 500;
  }

  footer {
    background-color: var(--color-background-inverse);
    color: var(--color-text-inverse);
    padding: calc(var(--spacing) * 3) var(--spacing);
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
