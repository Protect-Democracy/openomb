<script lang="ts">
  import type { PageData } from './$types';
  import { siteName } from '$config';
  import { formatNumber } from '$lib/formatters';
  import SearchForm from './SearchForm.svelte';
  import AgencyList from './AgencyList.svelte';

  export let data: PageData;
  const currentYear = new Date().getFullYear();
</script>

<section class="summary page-container">
  <h1>Accessing apportionment data just got better.</h1>

  <p class="center-container">
    Updated daily, {siteName} is the easiest way to find and view information on how federal money can
    be spent.
  </p>

  <div class="search center-container">
    <SearchForm />
  </div>
</section>

<section class="stats full-container">
  <div class="text-container center-container">
    <h2 class="sr-only">Apportionment approval statistics</h2>

    <p>
      <strong>{formatNumber(data.fileStats?.filesApprovedThisWeek)}</strong>
      New apportionments approved this week
    </p>

    <p>
      <strong>{formatNumber(data.fileStats?.filesCurrentFiscalYear)}</strong>
      Total apportionments approved this fiscal year {currentYear}
    </p>
  </div>
</section>

<section class="agencies page-container">
  <h2>Find Apportionments by Agency and Bureau</h2>

  <AgencyList agencies={data.agencies} headerElement="h3" />
</section>

<style>
  .summary {
    text-align: center;
    margin-top: var(--spacing-double);
    margin-bottom: var(--spacing-large);
  }

  .search {
    margin: var(--spacing-double) auto;
    width: calc(var(--copy-width-limit) * 0.75);
  }

  .stats {
    background-color: var(--color-background-accent);
    color: var(--color-background-color);
    margin-bottom: var(--spacing-large);
  }

  .stats > div {
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
    margin-bottom: var(--spacing-large);
  }
</style>
