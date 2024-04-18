<script lang="ts">
  import type { PageData } from './$types';
  import { siteName } from '$config';
  import { formatNumber } from '$lib/formatters';
  import SearchForm from './SearchForm.svelte';
  import AgencyList from './AgencyList.svelte';

  export let data: PageData;
  const currentYear = new Date().getFullYear();
</script>

<svelte:head>
  <title>{siteName}</title>
</svelte:head>

<section class="summary">
  <h1>Accessing apportionment data just got better.</h1>
  <p>
    Updated daily, {siteName} is the easiest way to find and view information on how federal money can
    be spent.
  </p>

  <div class="search">
    <SearchForm />
  </div>

  <div class="actions">
    <a class="button" href="/search">More search options</a>
    <a class="button alt" href="/about">About our process</a>
  </div>
</section>

<div class="accent-bg">
  <section class="stats">
    <h2 class="sr-only">Apportionment approval statistics</h2>

    <p>
      <strong>{formatNumber(data.fileStats?.filesApprovedThisWeek)}</strong>
      New apportionments approved this week
    </p>

    <p>
      <strong>{formatNumber(data.fileStats?.filesCurrentFiscalYear)}</strong>
      Total apportionments approved this fiscal year {currentYear}
    </p>
  </section>
</div>

<section class="agencies">
  <AgencyList agencies={data.agencies} />
</section>

<style>
  section {
    width: var(--copy-width-limit);
    margin: 0 auto var(--spacing-large);
  }

  .summary {
    text-align: center;
  }

  .search {
    margin: var(--spacing-double) auto;
    width: calc(var(--copy-width-limit) * 0.75);
  }

  .button.alt {
    color: var(--color-text);
    background-color: var(--color-gray-light);
    margin-left: var(--spacing);
  }

  .button.alt:hover {
    background-color: var(--color-highlight);
  }

  .accent-bg {
    background-color: var(--color-gray-light);
  }

  .stats {
    display: flex;
    justify-content: space-around;
    text-align: center;
    padding: var(--spacing-double) 0;
  }

  .stats p {
    max-width: calc(var(--spacing) * 10);
  }

  .stats strong {
    font-size: var(--font-size-large);
    display: block;
  }

  .agencies {
    width: unset;
    margin-left: var(--spacing-large);
    margin-right: var(--spacing-large);
  }
</style>
