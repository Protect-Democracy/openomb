<script lang="ts">
  /**
   * Inspiration from: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
   */
  import { page } from '$app/stores';
  import { slide } from 'svelte/transition';
  import ChevronDown from '$components/icons/ChevronDown.svelte';

  // State
  let expanded: { [key: string]: boolean } = {};

  // Put content into variables, as it's easier to manage the JS/No-JS duplication stuff
  const faqs = [
    {
      id: 'what-is-omb',
      question: 'What is the U.S. Office of Management and Budget?',
      answer: `
        <p>The Office of Management Budget (OMB) is a component of the Executive Office of the Presidency. OMB prepares the president&apos;s annual budget request and executes the budget after Congress enacts appropriations.</p>

        <p>OMB executes the budget by apportioning appropriations. That is, OMB makes appropriated funds available to federal agencies for particular purposes, during specified time periods. It does this in legally binding plans called "apportionments".</p>

        <p>OMB has several other core functions:
          <ul>
            <li>It oversees agency performance, procurement, and information technology.</li>
            <li>It coordinates and reviews all significant federal regulations.</li>
            <li>It reviews legislation and coordinates and clears agencies&apos; interactions with Congress, including testimony and legislative proposals. </li>
            <li>It reviews and clears executive orders and memoranda to agency heads.</li>
          </ul>
        </p>
      `
    },
    {
      id: 'what-is-apportionment',
      question: 'What is an apportionment?',
      answer: `
        <p>An apportionment is a legally binding plan that OMB uses to make federal funds available to federal agencies.</p>

        <p>Apportionments set limits &mdash; beyond those in appropriations and authorization legislation &mdash; on how and when an agency may spend funds, what an agency may spend funds on, and any conditions an agency must meet before spending funds.</p>

        <p>The apportionment of funds is the second step in the life cycle of federal funds. Congress appropriates funds. OMB apportions the appropriation. And agencies obligate the apportioned funds by purchasing a service, entering into a contract, awarding a grant, or otherwise taking an action that requires the government to make a payment.</p>

        <p>Congress created the apportionment power to ensure agencies spend within the limits of the law. It is meant to be a purely ministerial tool.</p>

        <p>Funds may be apportioned in several ways:
          <ol>
            <li>By time &mdash; e.g. months, calendar quarters, operating seasons, or other time periods. This is known as "Category A" apportionment. 31 U.S.C. § 1512(b)(1)(A).</li>
            <li>By agency activities, functions, or projects. This is known as a "Category B" apportionment. 31 U.S.C. § 1512(b)(1)(B).</li>
            <li>By time and project. This is known as a "Category AB" apportionment. 31 U.S.C. § 1512(b)(1)(C).</li>
          </ol>
        </p>

        <p>Apportionments are legally binding on an agency because they carry the force of the Antideficiency Act. Officials who fail to follow an apportionment may violate that law and expose themselves to administrative or criminal penalties, which include a fine of up to $5,000 and a prison term of up to two years. 31 U.S.C. § 1519.</p>
      `
    },
    {
      id: 'read-an-apportionment',
      question: 'How do I read an apportionment?',
      answer: `
        <p>Most apportionments come in the form of an Excel spreadsheet with rows and columns.</p>

        <p>The unnumbered rows at the top of an apportionment provide information about the account being apportioned, and the agency and bureau that receive the funds in that account.</p>

        <p>The numbered rows in an apportionment are split into a top half and a bottom half. The top half of the apportionment—line numbers starting with 1 (1xxx)—is purely descriptive. It reflects the budgetary resources generally available to the agency. The bottom half of the apportionment—line numbers starting with 6 (6xxx)—is where OMB exerts its apportionment power, dividing amounts by time, project, or both. This section of the apportionment is known as the application of budgetary resources and it is legally binding on the receiving agency.</p>

        <p>Funds in the application of budgetary resources section may be apportioned in several different ways:

          <ol>
            <li>By time &mdash; e.g. months, calendar quarters, operating seasons, or other time periods. This is known as “Category A” apportionment.</li>
            <li>By agency activities, functions, or projects. This is known as a “Category B” apportionment.</li>
            <li>By time and project. This is known as a “Category AB” apportionment.</li>
          </ol>
        </p>

        <p>Apportionments are complex documents. But in Oct. 2022, three experts hosted a training and broke down how to read them. Watch the training below or go <a href="https://youtu.be/XEDz8Wg2wx0?feature=shared&t=1450" target="_blank" rel="noopener noreferrer">directly to the video</a>.</p>

        <iframe
          src="https://www.youtube.com/embed/XEDz8Wg2wx0?si=_0rwraBK0ym0Pl2-&start=1450"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>

        <p>For more information on the line numbers in an apportionment, consult OMB Circular A-11, which <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=856" target="_blank" rel="noopener noreferrer">lists and explains the meaning of all possible line numbers</a>. For information on the “OMB Footnotes” column in apportionments, consult the next FAQ </p>
      `
    },
    {
      id: 'apportionment-footnote',
      question: 'What is an apportionment footnote?',
      answer: `
        <p>Apportionment footnotes provide further information about, or establish further legal requirements related to the use of, the resources in a given line or set of lines in an apportionment.</p>

        <p>There are two kinds of footnotes:

          <ol>
            <li>“A” footnotes are legally binding and establish further requirements related to, or conditions on the availability of, the apportioned funds. An “A” footnote might, for instance, require an agency to submit a spend plan to OMB for its approval before the agency may spend certain funds. (Spend plans detail how an agency will use the funds OMB is apportioning.)</li>
            <li>“B” footnotes appear in the budgetary resources section of the apportionment (its top half, lines 1xxx) and merely provide background information about a given line item or set of line items. A “B” footnote might, for instance, identify in greater detail the sources of the funds in a given line.</li>
          </ol>
        </p>

        <p>If footnotes appear on lines 1920 or 6190, they apply to all the lines in the 1xxx and 6xxx sections, respectively.</p>

        <p>For more information on apportionment footnotes, consult this <a href="https://youtu.be/XEDz8Wg2wx0?feature=shared&t=2670" target="_blank" rel="noopener noreferrer">expert training from Oct. 2022</a>.</p>
      `
    },
    {
      id: 'who-apportions-funds',
      question: 'Who may apportion funds?',
      answer: `
        <p>The Antideficiency Act gives the president the power to apportion funds. 31 U.S.C. § 1513(b). The president has delegated that power to the OMB director, who has <a href="https://www.federalregister.gov/documents/2022/04/01/2022-06873/delegation-of-apportionment-authority" target="_blank" rel="noopener noreferrer">delegated it, in turn, to OMB’s deputy associate directors</a>.</p>
      `
    },
    {
      id: 'how-to-find-apportionments',
      question: 'How do I find apportionments for the funds I care about?',
      answer: `
        <p>Apportionments are done at the account level. The best and easiest way to find an apportionment is thus to know the name or number of the relevant appropriation or fund account. Once you have this information, you can enter it into our search tool and navigate to the right apportionment.</p>

        <p>TODO</p>
      `
    },
    {
      id: 'what-is-tas-tafs',
      question: 'What is a TAS? What is a TAFS?',
      answer: `
        <p>TODO</p>
      `
    },
    {
      id: 'agency-has-spent',
      question:
        'Apportionments show what an agency can spend at a given time. Where can I find out what an agency has spent?',
      answer: `
        <p>TODO</p>
      `
    },
    {
      id: 'learn-more',
      question: 'I want to learn more about apportionments. What resources should I consult?',
      answer: `
        <p>TODO</p>
      `
    },
    {
      id: 'laws-govern-apportionments',
      question: 'What laws govern apportionments? ',
      answer: `
        <p>TODO</p>
      `
    }
  ];

  // TODO: Setup hash handling when expanding.  Probably need
  // to use a store to handle the double "inputs" of the URL
  // and tapping/clicking.

  // Derived
  // eslint-disable-next-line svelte/valid-compile
  $: hash = $page.url.hash;
  $: faqHash = (hash || '').replace(/#faq-/, '');
  $: faqs.forEach((f) => {
    expanded[f.id] =
      typeof expanded[f.id] === 'boolean'
        ? expanded[f.id]
        : faqHash && f.id === faqHash
          ? true
          : false;
  });

  // Toggle
  const toggleExpanded = (id: string) => {
    expanded[id] = !expanded[id];
  };
</script>

<div class="page-container content-container">
  <h1>Frequently Asked Questions</h1>

  <p>
    If your question is not addressed here, please reach out to us at <a
      href="mailto:contact@openomb.org">contact@openomb.org</a
    >.
  </p>

  <div class="text-container">
    <div class="has-js-only-block">
      <dl class="faqs">
        {#each faqs as faq (faq.id)}
          <dt id="faq-{faq.id}">
            <button
              type="button"
              class="like-text"
              aria-expanded={expanded[faq.id] ? 'true' : 'false'}
              aria-controls="faq-{faq.id}"
              on:click|preventDefault={() => toggleExpanded(faq.id)}
            >
              {faq.question} <span class="icon"><ChevronDown /></span></button
            >
          </dt>

          <dd id="faq-dd-{faq.id}">
            {#if expanded[faq.id]}
              <div transition:slide class="inner-dd">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html faq.answer}
              </div>
            {/if}
          </dd>
        {/each}
      </dl>
    </div>

    <div class="no-js-only-block">
      <dl class="faqs">
        {#each faqs as faq}
          <dt id="faq-{faq.id}">{faq.question}</dt>

          <dd id="faq-dd-{faq.id}">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html faq.answer}
          </dd>
        {/each}
      </dl>
    </div>
  </div>
</div>

<style>
  .faqs {
    padding-top: var(--spacing);

    dt {
      font-size: var(--font-size-large);
      margin-bottom: var(--spacing-half);

      button {
        display: block;
        width: 100%;

        display: flex;
        justify-content: space-between;
      }
    }

    dd {
      margin-left: 0;
      border-bottom: var(--border-weight) solid var(--color-text);
      margin-bottom: var(--spacing-double);
    }
  }

  /* NOTE: Cannot do global in nested selector
  /* https://github.com/sveltejs/svelte/issues/10540 */
  .faqs :global(iframe) {
    width: 100%;
    aspect-ratio: 16 / 9;
    margin-bottom: var(--spacing);
  }

  .icon {
    margin-left: var(--spacing);
    display: inline-block;
    min-width: 1em;
    width: 1em;
    height: 1em;
    margin-top: var(--spacing-small);
    transition: var(--transition);
  }

  [aria-expanded='true'] .icon {
    transform-origin: 50% 50%;
    transform: rotate(180deg);
  }
</style>
