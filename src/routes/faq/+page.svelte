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
      question: 'What is the U.S. Office of Management and Budget (OMB)?',
      answer: `
        <p>OMB is part of the Executive Office of the Presidency and helps the president execute her agenda across the executive branch. One way OMB does this is by exercising an important power on the president&apos;s behalf: the power to apportion Congress&apos;s appropriations.</p>

        <p>After Congress enacts appropriations and other spending laws, OMB makes appropriated funds available to agencies to spend through legally binding plans called &ldquo;apportionments.&rdquo; Apportionments tell agencies what funds they may spend, when they may spend them, and any conditions they must meet in order to spend them.</p>

        <p>Through OMB&apos;s apportionments, the president implements Congress&apos;s spending laws and exercises centralized control over the executive branch.</p>

        <p>OMB has several other core functions:</p>
        <ul>
          <li>It prepares the president&apos;s annual budget request to Congress.</li>
          <li>It oversees agency performance, procurement, and information technology.</li>
          <li>It coordinates and reviews all significant federal regulations.</li>
          <li>It reviews legislation and coordinates and clears agencies&apos; interactions with Congress, including testimony and legislative proposals. </li>
          <li>It reviews and clears executive orders and memoranda to agency heads.</li>
        </ul>
      `
    },
    {
      id: 'what-is-apportionment',
      question: 'What is an apportionment?',
      answer: `
        <p>An apportionment is a legally binding plan that the president, acting through OMB, issues to federal agencies telling them what money they may spend and when they may spend it. </p>

        <p>Apportionments set limits &mdash; beyond those in appropriations and authorization legislation &mdash; on how and when an agency may spend funds, what an agency may spend funds on, and any conditions an agency must meet before spending funds.</p>

        <p>The apportionment of funds is the second step in the life cycle of federal funds.</p>
        <ol>
          <li>Congress appropriates funds.</li>
          <li>The president, acting through OMB, apportions the appropriation.</li>
          <li>And agencies obligate the apportioned funds by purchasing a service, entering into a contract, awarding a grant, or otherwise taking an action that requires the government to make a payment.</li>
        </ol>

        <p>Congress created the apportionment power to ensure agencies spend within the limits of the law. It is meant to be a purely ministerial tool. But presidents of both parties have abused this tool in violation of the law and in excess of their authority. President Trump did so by withholding U.S. military aid to Ukraine, which <a href="https://www.gao.gov/assets/b-331564.pdf" target="_blank" rel="noopener noreferrer">violated the Impoundment Control Act</a>. And President Obama did so by <a href="https://casetext.com/case/us-house-of-representatives-v-capacity" target="_blank" rel="noopener noreferrer">using money that Congress had appropriated for a premium tax credit</a> instead to fund Affordable Care Act cost-sharing subsidies, which Congress had expressly refused to fund during the appropriations process.</p>

        <p>Appropriated funds may be apportioned in several ways:</p>
        <ol>
          <li>By time &mdash; e.g. months, calendar quarters, operating seasons, or other time periods. This is known as &ldquo;Category A&rdquo; apportionment. 31 U.S.C. § 1512(b)(1)(A).</li>
          <li>By agency activities, functions, or projects. This is known as a &ldquo;Category B&rdquo; apportionment. 31 U.S.C. § 1512(b)(1)(B).</li>
          <li>By time and project. This is known as a &ldquo;Category AB&rdquo; apportionment. 31 U.S.C. § 1512(b)(1)(C).</li>
        </ol>

        <p>Apportionments are legally binding on an agency because they carry the force of the Antideficiency Act. Officials who fail to follow an apportionment may violate that law and expose themselves to administrative or criminal penalties, which include a fine of up to $5,000 and a prison term of up to two years. 31 U.S.C. § 1519.</p>
      `
    },
    {
      id: 'read-an-apportionment',
      question: 'How do I read an apportionment?',
      answer: `
        <p>Most apportionments come in the form of an Excel spreadsheet with rows and columns.</p>

        <p>The unnumbered rows at the top of an apportionment provide information about the funds being apportioned and the agency and bureau that receive those funds.</p>

        <p>The numbered rows in an apportionment are split into a top half and a bottom half. The top half of the apportionment &mdash; line numbers starting with 1 (1xxx) &mdash; is purely descriptive. It reflects the budgetary resources generally available to the agency. (Budgetary resources include unobligated balances from prior years, appropriations, authority to borrow money, and authority to enter into contracts, among other resources.)</p>

        <p>The bottom half of the apportionment—line numbers starting with 6 (6xxx) &mdash; is where OMB exerts its apportionment power, dividing amounts by time, project, or both. This section of the apportionment is known as the application of budgetary resources and it is legally binding on the receiving agency.</p>

        <p>Funds in the application of budgetary resources section may be apportioned in several different ways:</p>

        <ol>
          <li>By time &mdash; e.g. months, calendar quarters, operating seasons, or other time periods. This is known as &ldquo;Category A&rdquo; apportionment.</li>
          <li>By agency activities, functions, or projects. This is known as a &ldquo;Category B&rdquo; apportionment.</li>
          <li>By time and project. This is known as a &ldquo;Category AB&rdquo; apportionment.</li>
        </ol>

        <p>Apportionments are complex documents. But in Oct. 2022, three experts hosted a training and broke down how to read them. Watch the training below or go <a href="https://youtu.be/XEDz8Wg2wx0?feature=shared&t=1450" target="_blank" rel="noopener noreferrer">directly to the video</a>.</p>

        <iframe
          src="https://www.youtube.com/embed/XEDz8Wg2wx0?si=_0rwraBK0ym0Pl2-&start=1450"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>

        <p>For more information on the line numbers in an apportionment, consult OMB Circular No.  A-11, which <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=856" target="_blank" rel="noopener noreferrer">lists and explains the meaning of all possible line numbers</a>. For information on the &ldquo;OMB Footnotes&rdquo; column in apportionments, consult the next FAQ </p>
      `
    },
    {
      id: 'apportionment-footnote',
      question: 'What is an apportionment footnote?',
      answer: `
        <p>Footnotes are one of the most important parts of the apportionment. They provide further information about the funds in the apportionment or establish additional legal requirements related to the use of those funds.</p>

        <ol>
          <li><strong>&ldquo;A&rdquo; footnotes</strong> are legally binding and establish further requirements related to, or conditions on the availability of, the apportioned funds. An &ldquo;A&rdquo; footnote might, for instance, require an agency to submit a spend plan to OMB before the agency may spend certain funds. Spend plans detail how an agency will use the funds OMB is apportioning. (See this example of a spend plan footnote in a <a href="/file/11345008">May 2024 apportionment for the Department of Veterans Affairs</a>.) OMB might also use an &ldquo;A&rdquo; footnote to <a href="https://www.gao.gov/assets/b-331564.pdf" target="_blank" rel="noopener noreferrer">put an indefinite hold on funding</a> &mdash; as it did in 2019 when it withheld U.S. security assistance to Ukraine. This action <a href="https://www.gao.gov/assets/b-331564.pdf" target="_blank" rel="noopener noreferrer">violated the Impoundment Control Act</a>.</li>
          <li><strong>&ldquo;B&rdquo; footnotes</strong> appear in the budgetary resources section of the apportionment (its top half, lines 1xxx) and merely provide background information about a given line item or set of line items. A &ldquo;B&rdquo; footnote might, for instance, identify in greater detail the sources of the funds in a given line.</li>
        </ol>

        <p>If footnotes appear on lines 1920 or 6190, they apply to all the lines in the 1xxx and 6xxx sections, respectively.</p>

        <p>For more information on apportionment footnotes, consult this <a href="https://youtu.be/XEDz8Wg2wx0?feature=shared&t=2670" target="_blank" rel="noopener noreferrer">expert training from Oct. 2022</a> (0:44:30-1:00:54).</p>
      `
    },
    {
      id: 'apportionment-iteration',
      question: 'What is an apportionment &ldquo;iteration&rdquo;? ',
      answer: `
        <p>An &ldquo;iteration&rdquo; is the version of an apportionment. </p>

        <p>Although OMB sometimes issues only a single apportionment for an account in a given fiscal year (see, e.g., the <a href="/agency/equal-employment-opportunity-commission/bureau/equal-employment-opportunity-commission/account/salaries-and-expenses">Salaries and Expenses Account for the Equal Employment Opportunity Commission</a>), OMB often issues multiple apportionments for a single account over the course of a fiscal year. Each subsequent apportionment (known as a &ldquo;<a href="https://www.gao.gov/assets/gao-05-734sp.pdf#page=86" target="_blank" rel="noopener noreferrer">reapportionment</a>&rdquo;) revises and supersedes the prior version. And each version has an iteration number. The first apportionment in a given fiscal year is Iteration 1, the second is Iteration 2, and so on. </p>

        <p>Take, for example, the FY2022 apportionments for the no-year appropriation within U.S. Immigration and Custom Enforcement&apos;s Operations and Support Account. This no-year sub-account within the Operations and Support Account is designated by the TAFS 070-0540 /X. In FY2022, that sub-account had four apportionments:
          <a href="/file/11201779#tafs_11201779--070-0540--1--2022">Iteration 1</a>, issued on Oct. 27, 2021;
          <a href="/file/11210384#tafs_11210384--070-0540--2--2022">Iteration 2</a>, issued on Mar. 7, 2022;
          <a href="/file/11219232#tafs_11219232--070-0540--3--2022">Iteration 3</a>, issued on Apr. 23, 2022;
          and <a href="/file/11237553#tafs_11237553--070-0540--4--2022">Iteration 4</a>, issued on Sept. 2, 2022.
        </p>

        <p>The number of iterations for a given account can tell us how closely OMB is overseeing or exerting control over the use of the funds in that account. For instance, that there were <a href="/file/11246309#tafs_11246309--070-0540-2023-2023--1--2023">eight apportionment iterations for one ICE Operations and Support sub-account</a> (TAFS 070-0540 /2023) tells us that OMB was paying closer attention to the use of those funds than it was to the use of the EEOC&apos;s Salaries and Expenses funds, for which there was one apportionment per account per fiscal year.</p>
      `
    },
    {
      id: 'who-apportions-funds',
      question: 'Who may apportion funds?',
      answer: `
        <p>The Antideficiency Act gives the president the power to apportion funds. 31 U.S.C. § 1513(b). The <a href="https://www.archives.gov/federal-register/codification/executive-order/06166.html" target="_blank" rel="noopener noreferrer">president has delegated that power</a> to the OMB director, who has <a href="https://www.federalregister.gov/documents/2022/04/01/2022-06873/delegation-of-apportionment-authority" target="_blank" rel="noopener noreferrer">delegated it, in turn, to OMB&apos;s deputy associate directors</a>.</p>
      `
    },
    {
      id: 'how-to-find-apportionments',
      question: 'How do I find apportionments for the funds I care about?',
      answer: `
        <p>There are a number of ways to use OpenOMB&apos;s database to find the funds you care about.</p>

        <ul>
          <li>One way is to <a href="/explore">explore by agency and bureau</a>.</li>
          <li>Another is to use our <a href="/search">keyword search</a> to search the terms of interest to you &mdash; for instance, searching &ldquo;immigration&rdquo; to find accounts and apportionments related to immigration. You can restrict this search by agency and bureau to find immigration-related apportionments only for a particular agency, like the Department of Homeland Security, or only for a particular component of DHS, such as U.S. Immigration and Customs Enforcement.</li>
          <li>If you&apos;re wondering how OMB has been executing a recently passed appropriations bill, you could search the public law number in the <a href="/search">keyword search</a>. For instance, to find apportionments for the <a href="https://www.congress.gov/bill/118th-congress/house-bill/815/text" target="_blank" rel="noopener noreferrer">April 2024 supplemental appropriations bill</a> providing security assistance to Ukraine, Israel, and Taiwan, you would search &ldquo;118-50&rdquo; for the bill&apos;s public law number.</li>
        </ul>

        <p>Another approach is to search for the name or number of the account being apportioned. An apportionment makes available to an agency the budgetary resources from a given appropriation or fund account that is set up in the Treasury. The name of an account typically originates in an appropriations act &mdash; specifically in the act&apos;s unnumbered paragraph headings, which correspond to an account set up in the Treasury for a particular agency and bureau. Take, for example, the &ldquo;Health Care Systems&rdquo; appropriation in the Consolidated Appropriations Act of 2022. That appropriation is for the Health Resources and Services Administration (the bureau) within the Department of Health and Human Services (the agency). &ldquo;Health Care Systems&rdquo; is the title of the unnumbered paragraph heading in the appropriations act. It denotes an account set up in the Treasury called &ldquo;Health Care Systems.&rdquo;</p>

        <p>Thus, to search by the name or number of the account, you can search by:</p>

        <ul>
          <li>The likely title of the account found in the unnumbered paragraph headings of an appropriations act;</li>
          <li>Or the number of the account &mdash; the Treasury Account Symbol, or TAS &mdash; found in the Treasury Department&apos;s <a href="https://www.fiscal.treasury.gov/reference-guidance/fast-book/" target="_blank" rel="noopener noreferrer">Federal Account Symbols and Titles (FAST) Book Part II</a>. For more information on the TAS, see the FAQ below.</li>
          <li>For more detailed instructions on finding an account name and number, consult <a href="https://protectdemocracy.org/work/using-ombs-apportionment-website-resources-for-congress/#finding-an-apportionment" target="_blank" rel="noopener noreferrer">these instructions</a>.</li>
        </ul>
      `
    },
    {
      id: 'how-have-presidents-abused-this-power',
      question: 'How have presidents abused the apportionment power?',
      answer: `
        <p>President Trump abused the apportionment power by withholding U.S. military aid to Ukraine through a series of apportionment footnotes that put a pause on that funding. The Government Accountability Office found that this hold <a href="https://www.gao.gov/assets/b-331564.pdf" target="_blank" rel="noopener noreferrer">violated the Impoundment Control Act</a>. </p>

        <p>President Obama <a href="https://casetext.com/case/us-house-of-representatives-v-capacity" target="_blank" rel="noopener noreferrer">abused this power</a> by <a href="https://www.govinfo.gov/content/pkg/CHRG-114hhrg23194/pdf/CHRG-114hhrg23194.pdf#page=11" target="_blank" rel="noopener noreferrer">using money that Congress had appropriated for a premium tax credit</a> in part to fund Affordable Care Act cost-sharing subsidies, which Congress had expressly refused to fund during the appropriations process.</p>
      `
    },
    {
      id: 'what-is-tas-tafs',
      question: 'What is a TAS? What is a TAFS?',
      answer: `
        <p>A TAS is a Treasury Account Symbol. A TAFS is a Treasury Appropriation Fund Symbol. A TAS generically describes any account in the Treasury. A TAFS is a particular kind of account, namely one with budget authority &mdash;  authority provided by statute to enter into financial obligations, such as by making payments, borrowing money, or contracting.</p>

        <p>A TAS is composed of a three-digit agency identifier code and a four-digit account-specific code.</p>

        <ul>
          <li>The TAS for the Health Care Systems appropriation account is 075 0357. 075 identifies the Department of Health and Human Services as the agency and 0357 identifies Health Care Systems as an account in HHS&apos;s Health Resources and Services Administration.</li>
        </ul>

        <p>A TAFS is composed of the three-digit agency identifier code, the four-digit account-specific code, and an additional piece of information: the period of availability of the funding. This period may be annual, or a single fiscal year; multi-year, or multiple fiscal years; or no-year, which means the funds are available until they are expended. No-year accounts are denoted by an X.</p>

        <ul>
          <li>For the Health Care Systems account, we see several kinds of TAFS. 075-0357 /X is a no-year account. 075-0357 2020/2022 was a multi-year account with funds available from fiscal year 2020-2022. And 075-0357 /2024 is an annual account with funding available only for fiscal year 2024.</li>
        </ul>

        <p>A list of every TAS can be found in the <a href="https://www.fiscal.treasury.gov/reference-guidance/fast-book/" target="_blank" rel="noopener noreferrer">Treasury Department&apos;s Federal Account Symbols and Titles (FAST) Book Part II</a>.</p>

        <p>Search Tip: When entering a TAS into our search tool, be sure to hyphenate the three-digit agency identifier code and four-digit unique account code as follows: 075-0357.</p>
      `
    },
    {
      id: 'agency-has-spent',
      question:
        'Apportionments show what an agency can spend at a given time. Where can I find out what an agency has spent?',
      answer: `
        <p>The report on budget execution and budgetary resources &mdash; also known as an SF-133 &mdash; shows what an agency has spent. <a href="https://portal.max.gov/portal/document/SF133/Budget/FACTS%20II%20-%20SF%20133%20Report%20on%20Budget%20Execution%20and%20Budgetary%20Resources.html" target="_blank" rel="noopener noreferrer">OMB publishes SF-133s</a>.</p>

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

        <p>After working on budget execution at the Department of Health and Human Services for over 30 years, Ed Martin created a more detailed series of video explainers on apportionments:</p>

        <ul>
          <li><a href="https://www.youtube.com/watch?v=23LQErvq4PE" target="_blank" rel="noopener noreferrer">Module 1</a> defines an apportionment, explains why we apportion, and lays out the basic rules of apportionment. </li>
          <li><a href="https://www.youtube.com/watch?v=Uhkik94uS1g" target="_blank" rel="noopener noreferrer">Module 2</a> covers the apportionment form, the Standard Form (SF) 132. </li>
          <li><a href="https://www.youtube.com/watch?v=fUcCIZQep6U" target="_blank" rel="noopener noreferrer">Module 3</a> examines the rest of the apportionment and the circumstances in which an apportionment is not necessary. </li>
        </ul>

        <p>An array of government resources also offer further information about apportionments. </p>

        <p>OMB Circular No. A-11 is the manual behind the federal budget, offering guidance to agencies on budget preparation, submission, and execution. Sections 120, 123, 124 of A-11 concern apportionments.</p>

        <ul>
          <li>Section 120 covers the apportionment process.</li>
          <li>Section 123 covers apportionments under continuing resolutions.</li>
          <li>Section 124 covers agency operations in the absence of appropriations.</li>
          <li>Appendix F covers the format of the Standard Form (SF) 132 (the apportionment form) and SF 133 (the report on budget execution and budgetary resources)</li>
        </ul>

        <p>OMB updates Circular A-11 annually. One may find the most up-to-date version here: <a href="https://www.whitehouse.gov/omb/information-for-agencies/circulars/" target="_blank" rel="noopener noreferrer">https://www.whitehouse.gov/omb/information-for-agencies/circulars/</a></p>
      `
    },
    {
      id: 'laws-govern-apportionments',
      question: 'What laws govern apportionments?',
      answer: `
        <p>Congress created the apportionment power in the Antideficiency Act to ensure federal agencies spend within the limits of the law. Failing to follow an apportionment may violate the Antideficiency Act and result in administrative or criminal penalties for the violating official.</p>

        <p>The Antideficiency Act sections relevant to apportionments may be found <a href="https://www.law.cornell.edu/uscode/text/31/subtitle-II/chapter-15/subchapter-II" target="_blank" rel="noopener noreferrer">here</a> and below:</p>

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
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html faq.question}
              <span class="icon"><ChevronDown /></span></button
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

    <noscript>
      <div class="no-js-only-block">
        <dl class="faqs">
          {#each faqs as faq}
            <dt id="faq-{faq.id}">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html faq.question}
            </dt>

            <dd id="faq-dd-{faq.id}">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html faq.answer}
            </dd>
          {/each}
        </dl>
      </div>
    </noscript>
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
