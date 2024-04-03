<script lang="ts">
  import { isProduction } from '$lib/utilities';
  import '../app.css';
</script>

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

  <h1>Apportionments</h1>

  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>

<main id="main-content">
  <slot />
</main>

<footer>Some footer content here.</footer>

<style>
  header {
    background-color: var(--color-background-inverse);
    color: var(--color-text-inverse);
    padding: var(--spacing);
  }

  h1 {
    padding: 0;
    margin: 0;
  }

  nav a {
    color: var(--color-text-inverse);
    margin-right: var(--spacing);
  }

  main {
    padding: var(--spacing);
  }

  footer {
    background-color: var(--color-background-inverse);
    color: var(--color-text-inverse);
    padding: calc(var(--spacing) * 3) var(--spacing);
  }

  .development {
    padding: var(--spacing);
    background: var(--color-highlight);
  }

  .development p {
    margin: 0 auto;
    text-align: center;
  }
</style>
