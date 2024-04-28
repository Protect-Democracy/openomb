<script lang="ts">
  import type { PageData } from './$types';
  import { siteName } from '$config';
  import { formatNumber } from '$lib/formatters';
  import SearchForm from './SearchForm.svelte';
  import AgencyExplorer from '../components/agencies/AgencyExplorer.svelte';
  import TopRightArrow from '$components/icons/TopRightArrow.svelte';
  import graphIllustration from '$assets/graph-illustration.svg';

  export let data: PageData;
  const currentYear = new Date().getFullYear();
</script>

<section class="intro">
  <div class="intro-inner page-container">
    <div class="intro-text">
      <h1>Accessing apportionment data just got better.</h1>

      <p class="center-container">
        Updated daily, {siteName} is the easiest way to find and view information on how federal money
        can be spent.
      </p>

      <div class="search">
        <SearchForm />
      </div>
    </div>

    <div class="intro-visual">
      <img src={graphIllustration} alt="Illustration of donut chart highlighting one slice." />
    </div>
  </div>
</section>

<section class="summary">
  <div class="summary-inner page-container">
    <div class="summary-text">
      <h2 class="h3">
        Information about federal spending shouldn&apos;t be a challenge to find. So we built a
        website that makes it easy.
      </h2>

      <p>
        Short about us blurb quisque tempus velit eget porta tempus. Nam dignissim tempor purus eu
        malesuada. Vestibulum eros dui, tincidunt at.
      </p>

      <a href="/about">More about us</a>
    </div>

    <div class="summary-stats">
      <p>
        <strong>{formatNumber(data.fileStats?.filesApprovedThisWeek)}</strong>
        New apportionments approved this week
      </p>

      <p>
        <strong>{formatNumber(data.fileStats?.filesCurrentFiscalYear)}</strong>
        Total apportionments approved for fiscal year {currentYear}
      </p>
    </div>
  </div>
</section>

<section class="agencies page-container-small">
  <h2 class="h2-alt">Find Apportionments by Agency and Bureau</h2>

  <AgencyExplorer agencies={data.agencies} />

  <div class="explore">
    <a href="/explore">Explore more agencies</a>
  </div>
</section>

<section class="learn">
  <div class="page-container">
    <h2 class="h2-alt">Learn More About Federal Apportionments</h2>

    <ul class="learn-items">
      <li>
        <a href="/faq#TODO"
          ><span><TopRightArrow /></span> What do the different lines of information included in an apportionment
          mean?</a
        >
      </li>
      <li>
        <a href="/faq#TODO"
          ><span><TopRightArrow /></span> How can I find the Treasury Appropriation Fund Symbol (TAFS)
          for a specific account?</a
        >
      </li>
      <li>
        <a href="/faq#TODO"
          ><span><TopRightArrow /></span> Another FAQ question lorem ipsum dolor sit amet consectetur
          adipiscing?</a
        >
      </li>
      <li>
        <a href="/faq"><span><TopRightArrow /></span> Explore all apportionment FAQs</a>
      </li>
    </ul>
  </div>
</section>

<style>
  .intro {
    padding-top: var(--spacing-xlarge);
    padding-bottom: var(--spacing-xlarge);
    background-color: var(--color-background-alt);
    color: var(--color-text-alt);
  }

  .intro-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .intro-text {
    width: 50%;
  }

  .intro-text p {
    font-size: 1.35rem;
  }

  .intro-visual {
    padding: 0 var(--spacing);
  }

  .summary {
    background-color: var(--color-background-inverse);
    color: var(--color-text-inverse);
    padding: calc(var(--spacing) * 3) 0;
    margin-bottom: var(--spacing-large);
  }

  .summary h2 {
    margin-top: 0;
    padding-top: 0;
  }

  .summary-inner {
    display: flex;
    align-items: flex-start;
  }

  .summary-text {
    max-width: 23rem;
    margin-right: calc(var(--spacing) * 3);
  }

  .summary-stats {
    width: 100%;
    display: flex;
    justify-content: space-around;
    gap: var(--spacing-double);
  }

  .summary-stats p {
    width: 50%;
  }

  .summary-stats strong {
    font-family: var(--font-family-heading);
    font-size: var(--font-size-xlarge);
    display: block;
    color: var(--color-blue-lighter);
  }

  .agencies {
    margin-bottom: var(--spacing-xlarge);
  }

  .agencies h2 {
    text-align: center;
    margin-bottom: var(--spacing-large);
  }

  .explore {
    text-align: center;
  }

  .learn {
    background-color: var(--color-blue-lighter);
    border-top: var(--border-weight) solid var(--color-black);
    padding: var(--spacing-xlarge) 0;
  }

  .learn h2 {
    text-align: center;
    margin-bottom: var(--spacing-large);
    padding-top: 0;
  }

  .learn-items {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: var(--spacing-double);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .learn-items li {
    padding: 0;
    margin: 0;
  }

  .learn-items a {
    display: flex;
    align-items: center;
    align-items: flex-start;
    gap: var(--spacing);
    color: var(--color-text);
  }

  .learn-items span {
    min-width: var(--spacing-double);
    max-width: var(--spacing-double);
    color: var(--color-white);
  }
</style>
