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
      <h1>Finding apportionments just got easier.</h1>

      <p class="center-container">
        Updated daily, {siteName} is the easiest way to find apportionments issued by the U.S. Office
        of Management and Budget. Apportionments are legally binding plans that make budgetary resources
        available to federal agencies.
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
        It shouldn&apos;t be hard to track the funds available to federal agencies.
      </h2>

      <p>
        {siteName} makes that information easy to find, with a searchable database of OMB&apos;s apportionments
        from fiscal year 2022 to the present.
      </p>

      <a href="/about">More about us</a>
    </div>

    <div class="summary-stats">
      <p>
        <strong>{formatNumber(data.fileStats?.filesApprovedPastWeek)}</strong>
        New apportionments approved in the last 7 days
      </p>

      <p>
        <strong>{formatNumber(data.fileStats?.filesCurrentFiscalYear)}</strong>
        Total apportionments approved for fiscal year {currentYear}
      </p>

      <p>
        <strong>{formatNumber(data.tafsStats?.totalAccounts)}</strong>
        Total accounts tracked on {siteName}
      </p>

      <p>
        <strong>{formatNumber(data.tafsStats?.averageIterations)}</strong>
        Average number of iterations per apportionment
      </p>
    </div>
  </div>
</section>

<section class="agencies page-container-small">
  <h2 class="h2-alt">Explore Agencies with the Newest Apportionments</h2>

  <AgencyExplorer agencies={data.agencies} />

  <div class="explore">
    <a href="/explore">Explore more agencies</a>
  </div>
</section>

<section class="learn">
  <div class="page-container">
    <h2 class="h2-alt">Learn More About Apportionments</h2>

    <ul class="learn-items">
      <li>
        <a href="/faq#faq-what-is-apportionment"
          ><span class="faq-icon"><TopRightArrow /></span> What is an apportionment?</a
        >
      </li>
      <li>
        <a href="/faq#faq-how-to-find-apportionments"
          ><span class="faq-icon"><TopRightArrow /></span> How can I find the funds I&apos;m looking
          for?</a
        >
      </li>
      <li>
        <a href="/faq#faq-read-an-apportionment"
          ><span class="faq-icon"><TopRightArrow /></span> How do I read an apportionment?</a
        >
      </li>
      <li>
        <a href="/faq">
          <span class="faq-icon"><TopRightArrow /></span>
          <span>
            Explore all apportionment
            <acronym title="Frequently Asked Questions">FAQs</acronym>
          </span>
        </a>
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
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--spacing-double);
  }

  .summary-stats p {
    width: calc(50% - var(--spacing-double));
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

  .learn-items .faq-icon {
    min-width: var(--spacing-double);
    max-width: var(--spacing-double);
    color: var(--color-white);
  }

  @media (max-width: 768px) {
    .intro-visual {
      display: none;
    }

    .intro-text {
      width: 100%;
    }

    .summary-inner {
      flex-direction: column;
    }

    .summary-stats {
      margin-top: var(--spacing-large);
      text-align: center;
    }

    .learn-items {
      grid-auto-flow: row;
    }
  }
</style>
