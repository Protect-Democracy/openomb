<script lang="ts">
  /**
   * Inspiration from: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
   */
  import { page } from '$app/stores';
  import { slide } from 'svelte/transition';
  import { contactEmail } from '$config';
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

        <p>Here’s how to find an account name and number:

          <ol>
            <li>Begin with the relevant appropriations act.</li>
            <li>The unnumbered paragraph headings in an appropriations act correspond to an account set up in the Treasury for a particular agency and bureau. These headings typically serve as the name of the account.

              <ol>
                <li>Take, for example, the <a href="https://www.congress.gov/117/plaws/publ103/PLAW-117publ103.pdf#page=396" target="_blank" rel="noopener noreferrer">“Health Care Systems” appropriation</a> in the Consolidated Appropriations Act of 2022. That appropriation is for the Health Resources and Services Administration (the bureau) within the Department of Health and Human Services (the agency). </li>
                <li>“Health Care Systems” is the unnumbered paragraph heading. It denotes an account set up in the Treasury called “Health Care Systems.”</li>
              </ol>
            </li>

            <li>To verify that you have the correct account name and to find the corresponding account number, download the <a href="https://www.fiscal.treasury.gov/reference-guidance/fast-book/" target="_blank" rel="noopener noreferrer">Treasury Department’s Federal Account Symbols and Titles (FAST) Book Part II</a>.</li>
            <li>After opening the FAST Book, search for the account name you have identified. It should appear in the “Title” column of the spreadsheet.

              <ol>
                <li>Searching “Health Care Systems” brings us to the “Health Care Systems” account in the FAST Book’s Title column.</li>
              </ol>
            </li>

            <li>To the left of that column, you will notice columns with unique identifier codes. Column A contains agency identifier codes. Column B contains the code for a particular account within the agency.
              <ol>
                <li>For “Health Care Systems,” 075 identifies the Department of Health and Human Services and 0357 identifies Health Care Systems as an account in the Health Resources and Services Administration.</li>
              </ol>
            </li>

            <li>Column D—TAS, or Treasury Account Symbol—combines the codes in Columns A and B to form the unique code for the account.
              <ol>
                <li>For Health Care Systems, this is 075 0357.</li>
              </ol>
            </li>

            <li>At this point, you can enter into our search tool either the account name or the TAS. If you enter the TAS, be sure to hyphenate the numbers (e.g. 075-0357) to return the correct results.
            </li>

            <li>However, it is important to know that a single TAS often has multiple sub-accounts.
              <ol>
                <li>Searching 075-0357, for instance, returns five results: 075-0357 /X; 075-0357 /2024; 075-0357 /2023; 075-0357 /2022; and 075-0357 2020/2022.</li>
              </ol>
            </li>

            <li>These sub-accounts are denoted by a TAFS, or Treasury Appropriation Fund Symbol. Whereas a Treasury Account Symbol refers to any account in the Treasury, a TAFS is a TAS specifically with budget authority—that is, authority provided by statute to enter into financial obligations, such as by making payments, borrowing money, or contracting. Moreover, a TAFS contains an additional piece of information: the period of availability for the funding. This period may be annual, or a single fiscal year; multi-year, or multiple fiscal years; or no-year, which means the funds are available until they are expended. No-year accounts are denoted by an X.
              <ol>
                <li>For the Health Care Systems account, we see several kinds of TAFS. 075-0357 /X is a no-year account. 075-0357 2020/2022 was a multi-year account with funds available from fiscal year 2020-2022. And 075-0357 /2024 is an annual account with funding available only for fiscal year 2024.</li>
              </ol>
            </li>

            <li>Apportionments are done specifically at the TAFS level. However, if you are unsure whether the account you are searching for is an annual, multi-year, or no-year account, you are better off searching for the TAS—composed of the three-digit agency identifier code and the four digit account-specific code (e.g. 075 0357).</li>
          </ol>

        </p>
      `
    },
    {
      id: 'what-is-tas-tafs',
      question: 'What is a TAS? What is a TAFS?',
      answer: `
        <p>A TAS is a Treasury Account Symbol. A TAFS is a Treasury Appropriation Fund Symbol. A TAS generically describes any account in the Treasury. A TAFS is a particular kind of account, namely one with budget authority— authority provided by statute to enter into financial obligations, such as by making payments, borrowing money, or contracting.</p>

        <p>TODO</p>

        <p>TODO</p>

        <p>A TAS is composed of a three-digit agency identifier code and a four-digit account-specific code.

            <ul>
              <li>The TAS for the Health Care Systems appropriation account is 075 0357. 075 identifies the Department of Health and Human Services as the agency and 0357 identifies Health Care Systems as an account in HHS’s Health Resources and Services Administration.</li>
            </ul>
        </p>

        <p>A TAFS is composed of the three-digit agency identifier code, the four-digit account-specific code, and an additional piece of information: the period of availability of the funding. This period may be annual, or a single fiscal year; multi-year, or multiple fiscal years; or no-year, which means the funds are available until they are expended. No-year accounts are denoted by an X.

            <ul>
              <li>For the Health Care Systems account, we see several kinds of TAFS. 075-0357 /X is a no-year account. 075-0357 2020/2022 was a multi-year account with funds available from fiscal year 2020-2022. And 075-0357 /2024 is an annual account with funding available only for fiscal year 2024.</li>
            </ul>
        </p>

        <p>A list of every TAS can be found in the <a href="https://www.fiscal.treasury.gov/reference-guidance/fast-book/" target="_blank" rel="noopener noreferrer">Treasury Department’s Federal Account Symbols and Titles (FAST) Book Part II</a>.</p>

        <p>Search Tips:

            <ul>
              <li>When entering a TAS into our search tool, be sure to hyphenate the three-digit agency identifier code and four-digit unique account code as follows: 075-0357.</li>
              <li>When entering a TAFS into the search tool, follow these written conventions:

                <ul>
                  <li>For no-year accounts: 075-0357 /X</li>
                  <li>For multi-year accounts: 075-0357 2020/2022</li>
                  <li>For annual accounts: 075-0357 /2024</li>
                </ul>
              </li>
            </ul>
        </p>
      `
    },
    {
      id: 'agency-has-spent',
      question:
        'Apportionments show what an agency can spend at a given time. Where can I find out what an agency has spent?',
      answer: `
        <p>The report on budget execution and budgetary resources—also known as an SF-133—shows what an agency has spent. <a href="https://portal.max.gov/portal/document/SF133/Budget/FACTS%20II%20-%20SF%20133%20Report%20on%20Budget%20Execution%20and%20Budgetary%20Resources.html" target="_blank" rel="noopener noreferrer">OMB publishes SF-133s</a>.</p>

        <p>For information on how to read an SF-133, see this explainer by Ed Martin, a former official at the Department of Health and Human Services who worked on budget execution there for over 30 years:</p>

        <iframe
          src="https://www.youtube.com/embed/GDwjkdf2z5E"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      `
    },
    {
      id: 'learn-more',
      question: 'I want to learn more about apportionments. What resources should I consult?',
      answer: `
        <p>In Oct. 2022, three experts led a <a href="https://www.youtube.com/watch?v=XEDz8Wg2wx0&t=6465s" target="_blank" rel="noopener noreferrer">training on how to read apportionments</a> and the law governing them.</p>

        <p>After working on budget execution at the Department of Health and Human Services for over 30 years, Ed Martin created a more detailed series of video explainers on apportionments:

            <ul>
              <li><a href="https://www.youtube.com/watch?v=23LQErvq4PE" target="_blank" rel="noopener noreferrer">Module 1</a> defines an apportionment, explains why we apportion, and lays out the basic rules of apportionment. </li>
              <li><a href="https://www.youtube.com/watch?v=Uhkik94uS1g" target="_blank" rel="noopener noreferrer">Module 2</a> covers the apportionment form, the Standard Form (SF) 132. </li>
              <li><a href="https://www.youtube.com/watch?v=fUcCIZQep6U" target="_blank" rel="noopener noreferrer">Module 3</a> examines the rest of the apportionment and the circumstances in which an apportionment is not necessary. </li>
            </ul>
        </p>

        <p>An array of government resources also offer further information about apportionments. </p>

        <p>OMB Circular No. A-11 is the manual behind the federal budget, offering guidance to agencies on budget preparation, submission, and execution. Sections 120, 123, 124 of A-11 concern apportionments.

          <ul>
            <li>Section 120 covers the apportionment process.</li>
            <li>Section 123 covers apportionments under continuing resolutions.</li>
            <li>Section 124 covers agency operations in the absence of appropriations.</li>
            <li>Appendix F covers the format of the Standard Form (SF) 132 (the apportionment form) and SF 133 (the report on budget execution and budgetary resources)</li>
          </ul>
        </p>

        <p>OMB updates Circular A-11 annually. One may find the most up-to-date version here: <a href="https://www.whitehouse.gov/omb/information-for-agencies/circulars/" target="_blank" rel="noopener noreferrer">https://www.whitehouse.gov/omb/information-for-agencies/circulars/</a></p>
      `
    },
    {
      id: 'laws-govern-apportionments',
      question: 'What laws govern apportionments?',
      answer: `
        <p>Congress created the apportionment power in the Antideficiency Act to ensure federal agencies spend within the limits of the law. Failing to follow an apportionment may violate the Antideficiency Act and result in administrative or criminal penalties for the violating official.</p>

        <p>The Antideficiency Act sections relevant to apportionments may be found <a href="https://www.law.cornell.edu/uscode/text/31/subtitle-II/chapter-15/subchapter-II" target="_blank" rel="noopener noreferrer">here</a> and below:

          <ul>
            <li><a href="https://www.law.cornell.edu/uscode/text/31/1511" target="_blank" rel="noopener noreferrer">31 U.S.C. § 1511</a>: What is apportioned?</li>
            <li><a href="https://www.law.cornell.edu/uscode/text/31/1512" target="_blank" rel="noopener noreferrer">31 U.S.C. § 1512</a>: How should amounts be apportioned?</li>
            <li><a href="https://www.law.cornell.edu/uscode/text/31/1513" target="_blank" rel="noopener noreferrer">31 U.S.C. § 1513</a>: Who controls apportionments? When must apportionments be approved?</li>
            <li><a href="https://www.law.cornell.edu/uscode/text/31/1514" target="_blank" rel="noopener noreferrer">31 U.S.C. § 1514</a>: What are the requirements for a funds control system?</li>
            <li><a href="https://www.law.cornell.edu/uscode/text/31/1515" target="_blank" rel="noopener noreferrer">31 U.S.C. § 1515</a>: When can deficiency apportionments be requested? When can they be approved?</li>
            <li><a href="https://www.law.cornell.edu/uscode/text/31/1516" target="_blank" rel="noopener noreferrer">31 U.S.C. § 1516</a>: Which appropriations are exempt from apportionment?</li>
            <li><a href="https://www.law.cornell.edu/uscode/text/31/1517" target="_blank" rel="noopener noreferrer">31 U.S.C. § 1517</a>: What happens if an agency obligates or expends in excess of an apportionment?</li>
            <li><a href="https://www.law.cornell.edu/uscode/text/31/1518" target="_blank" rel="noopener noreferrer">31 U.S.C. § 1518</a>: What are the administrative penalties for exceeding an apportionment or administrative subdivision of funds?</li>
            <li><a href="https://www.law.cornell.edu/uscode/text/31/1519" target="_blank" rel="noopener noreferrer">31 U.S.C. § 1519</a>: What are the criminal penalties for exceeding an apportionment or administrative subdivision of funds?</li>
          </ul>
        </p>
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
      href="mailto:{contactEmail}">{contactEmail}</a
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
