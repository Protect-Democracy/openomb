<script lang="ts">
  import type { PageData } from './$types';
  import { siteName } from '$config';
  import { formatNumber } from '$lib/formatters';
  import SearchForm from './SearchForm.svelte';
  import RecentFiles from './RecentFiles.svelte';
  import TopRightArrow from '$components/icons/TopRightArrow.svelte';
  import Check from '$components/icons/Check.svelte';
  import graphIllustration from '$assets/graph-illustration.svg';

  export let data: PageData;
  const currentYear = new Date().getFullYear();
</script>

<section class="intro">
  <div class="intro-inner page-container">
    <div class="intro-text">
      <h1>Tracking apportionments just got easier.</h1>

      <p class="center-container">
        Apportionments are legally binding plans issued by the White House Office of Management and
        Budget that set the pace at which federal agencies may spend appropriated funds.
        {siteName}&apos;s database makes apportionments easy to find and track.
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
    <div class="summary-intro">
      <h2 class="h3">Why are apportionments important?</h2>

      <p>
        Apportionments are how the president, acting through <acronym
          title="Office of Management and Budget">OMB</acronym
        >, implements Congress&apos;s spending laws. Apportionments set the pace at which agencies
        may spend funds by specifying what money an agency may spend, when, and subject to what
        conditions. This is the second step in the life cycle of federal funds: Congress
        appropriates, <acronym title="Office of Management and Budget">OMB</acronym> apportions, and
        agencies spend. Administrations of both parties have abused this authority to halt or cut off
        funding for enacted programs, making oversight of apportionments vital.
      </p>

      <a href="/faq"
        >More apportionment <acronym title="Frequently Asked Questions">FAQs</acronym></a
      >
    </div>

    <div class="summary-list">
      <h2 class="h3">Apportionments are legally binding plans that show:</h2>

      <p>
        <span class="inline-icon"><Check /></span>
        <span>What money an agency can spend and when.</span>
      </p>

      <p>
        <span class="inline-icon"><Check /></span>
        <span
          >Any conditions <acronym title="Office of Management and Budget">OMB</acronym> has put on agency
          access to funds.</span
        >
      </p>

      <p>
        <span class="inline-icon"><Check /></span>
        <span
          >Whether <acronym title="Office of Management and Budget">OMB</acronym> is delaying access
          to, or withholding, funds.</span
        >
      </p>
    </div>
  </div>
</section>

<section class="stats">
  <h2 class="sr-only">Apportionment Statistics</h2>

  <div class="stats-inner page-container">
    <ul class="no-list">
      <li>
        <strong>{formatNumber(data.fileStats?.filesApprovedPastWeek)}</strong>
        <span>New apportionments approved in the last 7 days</span>
      </li>

      <li>
        <strong>{formatNumber(data.fileStats?.filesCurrentFiscalYear)}</strong>
        <span
          >Total apportionments approved for <acronym title="Fiscal Year">FY</acronym
          >{currentYear}</span
        >
      </li>

      <li>
        <strong>{formatNumber(data.tafsStats?.totalAccounts)}</strong>
        <span>Total accounts tracked by {siteName}</span>
      </li>
    </ul>
  </div>
</section>

<section class="recently-approved-files page-container-small">
  <h2 class="h2-alt">Recently Approved Apportionments</h2>

  <RecentFiles files={data.recentFiles} />

  <div class="explore">
    <a class="button" href="/explore">Explore apportionments by agency</a>
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
        <a href="/faq#faq-how-have-presidents-abused-this-authority"
          ><span class="faq-icon"><TopRightArrow /></span> How have presidents abused this authority?</a
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

    @media (max-width: 768px) {
      & {
        width: 100%;
      }
    }
  }

  .intro-visual {
    padding: 0 var(--spacing);

    @media (max-width: 768px) {
      & {
        display: none;
      }
    }
  }

  .summary {
    background-color: var(--color-background-inverse);
    color: var(--color-text-inverse);
    padding: var(--spacing-xlarge) 0;
    margin-bottom: 0;

    h2 {
      margin-top: 0;
      padding-top: 0;
      color: var(--color-blue-lighter);
    }

    .summary-inner {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-triple);

      @media (max-width: 768px) {
        & {
          flex-direction: column;
        }
      }
    }

    .summary-intro {
      flex-grow: 1;
      flex-basis: 33.3333%;

      @media (max-width: 1024px) {
        & {
          flex-basis: 50%;
        }
      }

      a {
        color: var(--color-text-inverse);
        text-decoration: underline;
      }
    }

    .summary-list {
      flex-grow: 1;
      flex-basis: 66.66666%;

      @media (max-width: 1024px) {
        & {
          flex-basis: 50%;
        }
      }

      p {
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-small);
        font-size: var(--font-size-slight);
        font-weight: var(--font-copy-weight-bold);
        border-bottom: var(--border-weight-thin) solid var(--color-gray-medium);
        margin: 0;
        padding: var(--spacing-smallish) 0;
      }

      p:first-of-type {
        border-top: var(--border-weight-thin) solid var(--color-gray-medium);
      }

      .inline-icon :global(svg) {
        color: var(--color-link);
      }
    }
  }

  .stats {
    background-color: var(--color-blue-lightest);
    border-bottom: var(--border-weight) solid var(--color-black);
    padding: var(--spacing-triple) 0;
    margin-bottom: var(--spacing-large);

    ul {
      display: flex;
      justify-content: space-between;
      gap: var(--spacing-xlarge);

      @media (max-width: 1024px) {
        & {
          flex-direction: column;
          gap: 0;
          align-items: center;
        }
      }
    }

    li {
      flex-grow: 1;
      flex-basis: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing);
    }

    strong {
      font-family: var(--font-family-heading);
      font-size: var(--font-size-xxlarge);

      @media (max-width: 1024px) {
        & {
          font-size: var(--font-size-xlarge);
        }
      }
    }
  }

  .recently-approved-files {
    margin-bottom: var(--spacing-xlarge);
  }

  .recently-approved-files h2 {
    text-align: center;
    margin-bottom: var(--spacing-large);
  }

  .explore {
    margin-top: var(--spacing-large);
    text-align: center;
  }

  .learn {
    background-color: var(--color-blue-lightest);
    border-top: var(--border-weight) solid var(--color-black);
    padding: var(--spacing-xlarge) 0;
  }

  .learn h2 {
    text-align: center;
    margin-bottom: var(--spacing-large);
    padding-top: 0;
    /* Slightly more consistent spacing */
    line-height: 1.01;
  }

  .learn-items {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: var(--spacing-double);
    margin: 0;
    padding: 0;
    list-style: none;

    @media (min-width: 768px) and (max-width: 1024px) {
      & {
        grid-template-columns: 1fr 1fr;
        grid-auto-flow: inherit;
        gap: var(--spacing);
      }
    }

    @media (max-width: 768px) {
      & {
        grid-auto-flow: row;
        gap: var(--spacing);
      }
    }
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
    font-size: var(--font-size-medium);
  }

  .learn-items .faq-icon {
    display: inline-block;
    min-width: var(--spacing-double);
    max-width: var(--spacing-double);
    color: var(--color-white);
  }
</style>
