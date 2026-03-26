<script lang="ts">
  /**
   * Inspiration from: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
   */
  import { page } from '$app/stores';
  import { slide } from 'svelte/transition';
  import { siteName, contactEmail, sourceDataUrl } from '$config';
  import ChevronDown from '$components/icons/ChevronDown.svelte';

  // State
  let expanded: { [key: string]: boolean } = {};

  // Put content into variables, as it's easier to manage the JS/No-JS duplication stuff
  const faqs = [
    {
      id: 'what-is-omb',
      question: 'What is the U.S. Office of Management and Budget (OMB)?',
      answer: `
        <p>OMB is a key part of the Executive Office of the President and helps the president execute their agenda across the executive branch. OMB does this in several ways:
          <ul>
            <li>It develops the president&apos;s annual budget request to Congress and helps execute the appropriations laws Congress passes by making funds available to federal agencies through the apportionment process.</li>
            <li>It coordinates and reviews all significant federal regulations.</li>
            <li>It oversees agency performance, procurement, information technology, and financial management.</li>
            <li>It reviews legislation and clears agencies&apos; interactions with Congress, including testimony and legislative proposals.</li>
            <li>It reviews and clears executive orders and memoranda to agency heads.</li>
          </ul>
        </p>

        <p>This site concerns only the apportionment of appropriated funds; it is a searchable database, updated daily, of OMB&apos;s public apportionments from fiscal year 2022 to the present. It does not show whether and how agencies have used apportioned funds.</p>

        <p>For more on what an apportionment is, see the next FAQ. For more information on OMB holistically, consult the <a href="https://www.whitehouse.gov/omb/" target="_blank" rel="noopener noreferrer">White House&apos;s website</a> and <a href="https://www.whitehousetransitionproject.org/wp-content/uploads/2020/07/WHTP2021-21-OMB-an-Insiders-Guide-1.pdf" target="_blank" rel="noopener noreferrer">The Office of Management and Budget: An Insider&apos;s Guide</a>, a resource written by former OMB officials. And to dig into what agencies do with the money they receive, check out <a href="https://www.usaspending.gov/" target="_blank" rel="noopener noreferrer">USAspending.gov</a> and <a href="https://grants.gov/" target="_blank" rel="noopener noreferrer">Grants.gov</a>.</p>
      `
    },
    {
      id: 'what-is-apportionment',
      question: 'What is an apportionment?',
      answer: `
        <p>An apportionment is a legally binding plan that sets the pace at which federal agencies may spend appropriated funds over the course of a fiscal year. Apportionments specify what funds an agency may spend, when, and any conditions an agency must meet before spending them.</p>

        <p>Congress <a href="https://www.law.cornell.edu/uscode/text/31/1513" target="_blank" rel="noopener noreferrer">established the apportionment process in the Antideficiency Act</a> and gave the president the authority to apportion appropriations. The president <a href="https://www.archives.gov/federal-register/codification/executive-order/06166.html" target="_blank" rel="noopener noreferrer">has delegated that authority to OMB</a>.</p>

        <p>The apportionment of funds is the second step in the life cycle of federal funds.
          <ol>
            <li>Congress appropriates the funds.</li>
            <li>OMB apportions the appropriation.</li>
            <li>And agencies obligate the apportioned funds by purchasing a service, entering into a contract, awarding a grant, or otherwise taking an action that requires the government to make a payment.</li>
          </ol>
        </p>

        <p>Congress created the apportionment authority to ensure agencies spend within the limits of the law. It is meant to be a purely ministerial tool that prevents agencies from prematurely exhausting the funds appropriated for them. But administrations of both parties have abused this tool in violation of the law and in excess of their authority. President Trump did so by withholding U.S. military aid to Ukraine through a series of apportionment footnotes, which <a href="https://www.gao.gov/assets/b-331564.pdf" target="_blank" rel="noopener noreferrer">violated the Impoundment Control Act</a>. Presidents Nixon and Roosevelt also abused this power, as we detail in another FAQ below.</p>

        <p>Appropriated funds may be apportioned in several ways:
          <ol>
            <li>By time &mdash; e.g. months, calendar quarters, operating seasons, or other time periods. This is known as &ldquo;Category A&rdquo; apportionment. 31 U.S.C. § 1512(b)(1)(A).</li>
            <li>By agency activities, functions, or projects. This is known as a &ldquo;Category B&rdquo; apportionment. 31 U.S.C. § 1512(b)(1)(B).</li>
            <li>By time and project. This is known as a &ldquo;Category AB&rdquo; apportionment. 31 U.S.C. § 1512(b)(1)(C).</li>
          </ol>
        </p>

        <p>Category A, B, and AB apportionments make funds available for the current fiscal year. Another category of apportionment &mdash; known as &ldquo;Category C&rdquo; &mdash; <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=404" target="_blank" rel="noopener noreferrer">reserves funds in &ldquo;multi-year&rdquo; accounts</a> (for instance, an account with money available from 2022-2027) or &ldquo;no-year&rdquo; accounts (in which funds are available for indefinite period) for future fiscal years. Funds found on a Category C line, in other words, are not available for the current fiscal year.</p>

        <p>Apportionments are legally binding on an agency under the Antideficiency Act. Officials who fail to follow an apportionment may violate that law and expose themselves to administrative or criminal penalties, which include a fine of up to $5,000 and a prison term of up to two years. 31 U.S.C. § 1519.</p>

        <iframe
          src="https://www.youtube.com/embed/UyGzVC6cDA4?list=PLZZGlWOJfMoLG7eyzlCkBP0IkuFG-5Y5P"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      `
    },
    {
      id: 'read-an-apportionment',
      question: 'How do I read an apportionment?',
      answer: `
        <p>Most apportionments come in the form of an Excel spreadsheet with rows and columns.</p>

        <p>The unnumbered rows at the top of an apportionment provide information about the funds being apportioned and the agency and bureau that receive those funds.</p>

        <p>The numbered rows in an apportionment are split into a top half and a bottom half. The top half of the apportionment &mdash; line numbers starting with 1 (1xxx) &mdash; is purely descriptive. It reflects the budgetary resources generally available to the agency. (Budgetary resources include unobligated balances from prior years, appropriations, authority to borrow money, and authority to enter into contracts, among other resources.)</p>

        <p>The bottom half of the apportionment—line numbers starting with 6 (6xxx) &mdash; is where OMB uses its statutory apportionment authority to divide amounts by time, project, or both. This section of the apportionment is known as the application of budgetary resources and it is legally binding on the receiving agency.</p>

        <p>Funds in the application of budgetary resources section may be apportioned in several different ways:
          <ol>
            <li>By time &mdash; e.g. months, calendar quarters, operating seasons, or other time periods. This is known as &ldquo;Category A&rdquo; apportionment.</li>
            <li>By agency activities, functions, or projects. This is known as a &ldquo;Category B&rdquo; apportionment.</li>
            <li>By time and project. This is known as a &ldquo;Category AB&rdquo; apportionment.</li>
            <li>Funds in &ldquo;no-year&rdquo; (or indefinite) accounts or &ldquo;multi-year&rdquo; accounts may also be reserved for future fiscal years. This is known as a &ldquo;Category C&rdquo; apportionment.</li>
          </ol>
        </p>

        <p>Inside the executive branch, <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=374" target="_blank" rel="noopener noreferrer">apportionments have several columns</a>. These columns reflect OMB&apos;s prior apportionment for a given account, the agency&apos;s request for a new apportionment, the current apportionment action, and the footnotes associated with each of these. These <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=374" target="_blank" rel="noopener noreferrer">columns are titled</a> &ldquo;Previous Approved,&rdquo; &ldquo;Prev Footnote,&rdquo; &ldquo;Agency Request,&rdquo; &ldquo;Agency Footnote,&rdquo; &ldquo;OMB Action,&rdquo; and &ldquo;OMB Footnote,&rdquo; respectively. The apportionments OMB discloses to the public contain only the &ldquo;OMB Action&rdquo; and &ldquo;OMB Footnote&rdquo; columns. But for accounts with more than one account-specific apportionment in a given fiscal year, OpenOMB recreates the &ldquo;Previous Approved&rdquo; and &ldquo;Prev Footnote&rdquo; columns by drawing on the data from the prior account-specific apportionment. This allows users more easily to compare an apportionment to its predecessor and see changes across apportionments.</p>

        <p>Apportionments are complex documents. But in Oct. 2022, three experts hosted a training session and broke down how to read them. Watch the training below or go <a href="https://youtu.be/XEDz8Wg2wx0?feature=shared&t=1450" target="_blank" rel="noopener noreferrer">directly to the video</a>.</p>

        <iframe
          src="https://www.youtube.com/embed/XEDz8Wg2wx0?si=_0rwraBK0ym0Pl2-&start=1450"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>

        <p>For more information on the line numbers in an apportionment, consult OMB Circular No.  A-11, which <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=856" target="_blank" rel="noopener noreferrer">lists and explains the meaning of all possible line numbers</a>. For information on the &ldquo;OMB Footnotes&rdquo; column in apportionments, consult the next FAQ.</p>

        <iframe
          src="https://www.youtube.com/embed/-VBsiVWVz7M?list=PLZZGlWOJfMoLG7eyzlCkBP0IkuFG-5Y5P"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      `
    },
    {
      id: 'apportionment-footnote',
      question: 'What is an apportionment footnote?',
      answer: `
        <p>Footnotes are one of the most important parts of the apportionment. They provide further information about the funds in the apportionment or establish additional legal requirements related to the use of those funds.</p>

        <p><ol>
          <li><strong>&ldquo;A&rdquo; footnotes</strong> are legally binding and establish further requirements related to, or conditions on the availability of, the apportioned funds. An &ldquo;A&rdquo; footnote might, for instance, require an agency to submit a &ldquo;spend plan&rdquo; to OMB before the agency may spend certain funds. Spend plans detail how an agency will use the funds OMB is apportioning. (See this example of a spend plan footnote in a <a href="/file/11345008">May 2024 apportionment for the Department of Veterans Affairs</a>.) OMB might also use an &ldquo;A&rdquo; footnote to <a href="https://www.gao.gov/assets/b-331564.pdf" target="_blank" rel="noopener noreferrer">put an indefinite hold on funding</a> &mdash; as it did in 2019 when it withheld U.S. security assistance to Ukraine. This action <a href="https://www.gao.gov/assets/b-331564.pdf" target="_blank" rel="noopener noreferrer">violated the Impoundment Control Act</a>.</li>
          <li><strong>&ldquo;B&rdquo; footnotes</strong> appear in the budgetary resources section of the apportionment (its top half, lines 1xxx) and merely provide background information about a given line item or set of line items. A &ldquo;B&rdquo; footnote might, for instance, identify in greater detail the sources of the funds in a given line.</li>
        </ol></p>

        <p>If footnotes appear on lines 1920 or 6190, they apply to all the lines in the 1xxx and 6xxx sections, respectively.</p>

        <p>For more information on apportionment footnotes, consult this <a href="https://youtu.be/XEDz8Wg2wx0?feature=shared&t=2670" target="_blank" rel="noopener noreferrer">expert training from Oct. 2022</a> (0:44:30-1:00:54).</p>

        <iframe
          src="https://www.youtube.com/embed/YjjXJYzWpZ4?list=PLZZGlWOJfMoLG7eyzlCkBP0IkuFG-5Y5P"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      `
    },
    {
      id: 'apportionment-iteration',
      question: 'What is an apportionment &ldquo;iteration&rdquo;? ',
      answer: `
        <p>An &ldquo;iteration&rdquo; is the version of an apportionment. </p>

        <p>The Antideficiency Act <a href="https://www.law.cornell.edu/uscode/text/31/1512" target="_blank" rel="noopener noreferrer">requires OMB to apportion appropriations</a> and review an apportionment at least four times a year. It also gives OMB the authority to <a href="https://www.gao.gov/assets/gao-05-734sp.pdf#page=86" target="_blank" rel="noopener noreferrer">&ldquo;reapportion&rdquo; an appropriation</a> &mdash; that is, to revise its original apportionment and issue a new version that supersedes the prior one. On ${siteName}, each version of an apportionment is referred to as an &ldquo;iteration.&rdquo; The first account-specific apportionment in a given fiscal year is Iteration 1, the second is Iteration 2, and so on. This convention matches the file names on OMB&apos;s apportionment website, <a href="${sourceDataUrl}" target="_blank" rel="noopener noreferrer">${new URL(sourceDataUrl).hostname}</a>. </p>

        <p>Take, for example, the FY2022 apportionments for the &ldquo;no-year&rdquo; (or indefinite) appropriation within U.S. Immigration and Customs Enforcement&apos;s Operations and Support Account. This no-year sub-account within the Operations and Support Account is designated by the TAFS 070-0540 /X. In FY2022, that sub-account had four apportionments:
          <a href="/file/11201779#tafs_11201779--070-0540--1--2022">Iteration 1</a>, issued on Oct. 27, 2021;
          <a href="/file/11210384#tafs_11210384--070-0540--2--2022">Iteration 2</a>, issued on Mar. 7, 2022;
          <a href="/file/11219232#tafs_11219232--070-0540--3--2022">Iteration 3</a>, issued on Apr. 23, 2022;
          and <a href="/file/11237553#tafs_11237553--070-0540--4--2022">Iteration 4</a>, issued on Sept. 2, 2022.
          (It is worth noting some accounts may have only a single apportionment for a given fiscal year. See, for instance, <a href="/agency/equal-employment-opportunity-commission/bureau/equal-employment-opportunity-commission/account/salaries-and-expenses">Salaries and Expenses Account for the Equal Employment Opportunity Commission</a>.)</p>
      `
    },
    {
      id: 'previously-approved',
      question:
        'What is the &ldquo;previously approved&rdquo; column on OpenOMB&apos;s apportionments?',
      answer: `
      <p>&ldquo;Previously approved&rdquo; reflects the prior apportionment action.</p>

      <p>Inside the executive branch, <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=374" target="_blank" rel="noopener noreferrer">apportionments have several columns</a>. These columns reflect OMB&apos;s prior apportionment for a given account, the agency&apos;s request for a new apportionment, the current apportionment action, and the footnotes associated with each of these. These <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=374" target="_blank" rel="noopener noreferrer">columns are titled</a> &ldquo;Previous Approved,&rdquo; &ldquo;Prev Footnote,&rdquo; &ldquo;Agency Request,&rdquo; &ldquo;Agency Footnote,&rdquo; &ldquo;OMB Action,&rdquo; and &ldquo;OMB Footnote,&rdquo; respectively.</p>

      <p>The apportionments OMB discloses to the public contain only the &ldquo;OMB Action&rdquo; and &ldquo;OMB Footnote&rdquo; columns. But for accounts with more than one account-specific apportionment in a given fiscal year, OpenOMB recreates the &ldquo;Previous Approved&rdquo; and &ldquo;Prev Footnote&rdquo; columns by drawing on the data from the prior account-specific apportionment. This allows users more easily to compare an apportionment to its predecessor and see changes across apportionments. </p>

      <p>However, if a user wants to see only the current apportionment without the previously approved column, they may use the &ldquo;hide previous iteration&rdquo; toggle to display only the current apportionment action.</p>

      <p>To see these features, check out this apportionment for the <a href="/file/11388868">Title 17 Innovative Technology Loan Guarantee Program</a>.</p>

      <p>OpenOMB&apos;s previously approved column does not reflect amounts made available to an agency under the <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=422" target="_blank" rel="noopener noreferrer">automatic apportionment that OMB approves</a> after the enactment of a short-term continuing resolution. (See, for example, <a href="https://www.whitehouse.gov/wp-content/uploads/2023/09/FY-2024-OMB-CR-Bulletin-23-02.pdf" target="_blank" rel="noopener noreferrer">OMB Bulletin No. 23-02</a>, the apportionment of the continuing resolution for fiscal year 2024.) The column reflects only prior account-specific apportionments. For more information on apportionments under a continuing resolution, check out our FAQ below and <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/s123.pdf" target="_blank" rel="noopener noreferrer">section 123 of OMB Circular No. A-11</a>.</p>
      `
    },
    {
      id: 'who-apportions-funds',
      question: 'Who may apportion funds?',
      answer: `
        <p>The Antideficiency Act gives the president the authority to apportion funds. 31 U.S.C. § 1513(b). The <a href="https://www.archives.gov/federal-register/codification/executive-order/06166.html" target="_blank" rel="noopener noreferrer">president has delegated that authority</a> to the OMB director, who has <a href="https://www.federalregister.gov/documents/2022/04/01/2022-06873/delegation-of-apportionment-authority" target="_blank" rel="noopener noreferrer">delegated it, in turn, to OMB&apos;s deputy associate directors</a> (or DADs). DADs are career officials in the Senior Executive Service. (OMB also has <a href="https://www.federalregister.gov/documents/2023/03/22/2023-05895/delegation-of-apportionment-authority" target="_blank" rel="noopener noreferrer">published a backup delegation of apportionment authority</a> in case the relevant DAD &ldquo;is not available to apportion or reapportion the account because of a continuity event.&rdquo;)</p>

        <p>In 2020, the Trump administration <a href="https://theintercept.com/2020/08/20/federal-funds-omb-apportionment-trump/" target="_blank" rel="noopener noreferrer">shifted apportionment authority from career DADs to OMB&apos;s program associate directors</a> (or PADs), who are political appointees. This was a change from longstanding practice. After President Biden took office, OMB Director Shalanda Young restored apportionment authority to OMB&apos;s DADs.</p>

        <p>To see a list of the titles of the OMB officials approving apportionments, check the &ldquo;Approved by&rdquo; dropdown on <a href="/search">our search page</a>. To see the title of the approving official on the file page for an apportionment you are viewing on ${siteName}, look for the &ldquo;Approved by&rdquo; information next to the fiscal year. And if you are viewing an apportionment in the original Excel file, check the &ldquo;Approval_Info&rdquo; tab.</a>
      `
    },
    {
      id: 'how-to-find-apportionments',
      question: 'How do I find apportionments for the funds I care about?',
      answer: `
        <p>There are a number of ways to use ${siteName}&apos;s database to find apportionments of interest.</p>

        <p><ul>
          <li>One way is to <a href="/explore">explore by agency and bureau</a>.</li>
          <li>Another is to use ${siteName}&apos;s <a href="/search">keyword search</a> function to search the terms of interest to you &mdash; for instance, searching &ldquo;immigration&rdquo; to find accounts and apportionments related to immigration. You can restrict this search by agency and bureau to find immigration-related apportionments only for a particular agency, like the Department of Homeland Security, or only for a particular component of DHS, such as U.S. Immigration and Customs Enforcement.</li>
          <li>To check how OMB has been executing a recently passed appropriations bill, you could search the public law number in the <a href="/search">keyword search</a>. For instance, to find apportionments for the <a href="https://www.congress.gov/bill/118th-congress/house-bill/815/text" target="_blank" rel="noopener noreferrer">April 2024 supplemental appropriations bill</a> providing security assistance to Ukraine, Israel, and Taiwan, you would search &ldquo;118-50&rdquo; for the bill&apos;s public law number.</li>
        </ul></p>

        <p>Another approach is to search for the name or number of the account being apportioned. An apportionment makes available to an agency the budgetary resources from a given appropriation or fund account that is set up in the Treasury. The name of an account typically originates in an appropriations act &mdash; specifically in the act&apos;s unnumbered paragraph headings, which correspond to an account set up in the Treasury for a particular agency and bureau. Take, for example, the &ldquo;Health Care Systems&rdquo; appropriation in the Consolidated Appropriations Act of 2022. That appropriation is for the Health Resources and Services Administration (the bureau) within the Department of Health and Human Services (the agency). &ldquo;Health Care Systems&rdquo; is the title of the unnumbered paragraph heading in the appropriations act. It denotes an account set up in the Treasury called &ldquo;Health Care Systems.&rdquo;</p>

        <p>Thus, to search by the name or number of the account, you can search by:
          <ul>
            <li>The likely title of the account found in the unnumbered paragraph headings of an appropriations act;</li>
            <li>Or the number of the account &mdash; the Treasury Account Symbol, or TAS &mdash; found in the Treasury Department&apos;s <a href="https://www.fiscal.treasury.gov/reference-guidance/fast-book/" target="_blank" rel="noopener noreferrer">Federal Account Symbols and Titles (FAST) Book Part II</a>. For more information on the TAS, see the FAQ below.</li>
            <li>For more detailed instructions on finding an account name and number, consult <a href="https://protectdemocracy.org/work/using-ombs-apportionment-website-resources-for-congress/#finding-an-apportionment" target="_blank" rel="noopener noreferrer">these instructions</a>.</li>
          </ul>
        </p>

        <iframe
          src="https://www.youtube.com/embed/AbuwWh0LgaQ?list=PLZZGlWOJfMoLG7eyzlCkBP0IkuFG-5Y5P"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
        ></iframe>
      `
    },
    {
      id: 'continuing-resolutions',
      question: 'What happens to apportionments under a continuing resolution?',
      answer: `
        <p>In recent years, Congress has struggled to pass full-year appropriations bills on time and therefore has tended to fund the government at the start of the fiscal year through short-term continuing resolutions (a continuing resolution is <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=452" target="_blank" rel="noopener noreferrer">considered</a> &ldquo;short-term&rdquo; if it lasts for only part of a fiscal year, rather than for a full fiscal year).</p>

        <p>Apportionments are done slightly differently under a CR than under full-year appropriations bills. </p>

        <p>Most accounts <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=453" target="_blank" rel="noopener noreferrer">receive</a> an automatic apportionment from OMB under its &ldquo;CR Bulletin,&rdquo; rather than the typical account-specific apportionment. The &ldquo;CR Bulletin&rdquo; <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=453" target="_blank" rel="noopener noreferrer">apportions</a> funds based on the rate established in the CR (usually in section 101). For a recent example, see <a href="https://www.whitehouse.gov/wp-content/uploads/2023/09/FY-2024-OMB-CR-Bulletin-23-02.pdf" target="_blank" rel="noopener noreferrer">OMB Bulletin No. 23-02</a>, the CR Bulletin OMB issued after the enactment of the continuing resolution for fiscal year 2024. (Automatic apportionments under a CR Bulletin are not reflected in the previously approved column on OpenOMB.) </p>

        <p>In rare cases, agencies may request account-specific apportionments during the CR that exceed the amount they were automatically apportioned under the bulletin. These are known as &ldquo;<a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=462" target="_blank" rel="noopener noreferrer">exception apportionments</a>.&rdquo; As OMB <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=462" target="_blank" rel="noopener noreferrer">states</a> in Circular No. A-11, it &ldquo;grants exception apportionment requests only in extraordinary circumstances.&rdquo; These circumstances <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=462" target="_blank" rel="noopener noreferrer">include</a> instances where the safety of human life or protection of federal property are at issue, or where a federal program typically requires more funding in some parts of the fiscal year than others. The quintessential example of this is the Low Income Housing Energy Assistance Program (LIHEAP), which <a href="https://www.acf.hhs.gov/ocs/programs/liheap">provides</a> families with federal financial assistance to pay home energy bills, and typically <a href="https://www.whitehouse.gov/wp-content/uploads/2018/06/a11.pdf#page=462" target="_blank" rel="noopener noreferrer">requires</a> more funding in the first two quarters of the fiscal year when the weather is colder. (See this example of a <a href="/file/11201256#tafs_11201256--075-1502-2022-2022--1--2022">LIHEAP exception apportionment</a> for FY2022.) </p>

        <p>However, not all accounts receive automatic apportionments under the CR Bulletin. Some accounts receive account-specific apportionments. OMB&apos;s FY2024 CR Bulletin <a href="https://www.whitehouse.gov/wp-content/uploads/2023/09/FY-2024-OMB-CR-Bulletin-23-02.pdf#page=11" target="_blank" rel="noopener noreferrer">outlines</a> the circumstances in which an account may receive an account-specific apportionment, rather than an automatic apportionment.</p>
      `
    },
    {
      id: 'how-have-presidents-abused-this-authority',
      question: 'How have presidents abused their apportionment authority?',
      answer: `
        <p>President Trump abused his apportionment authority by withholding U.S. military aid to Ukraine through a series of apportionment footnotes that put a pause on that funding. The Government Accountability Office found that this hold <a href="https://www.gao.gov/assets/b-331564.pdf" target="_blank" rel="noopener noreferrer">violated the Impoundment Control Act</a>.</p>

        <p>Trump was not the first president to push the bounds of this authority, however. President Nixon often <a href="https://www.congress.gov/93/crecb/1973/02/05/GPO-CRECB-1973-pt3-4-2.pdf#page=29" target="_blank" rel="noopener noreferrer">resorted to this tool</a>, among others, as his administration impounded billions of dollars in appropriated funds for an array of domestic programs. This led to a thicket of lawsuits against the administration, which it overwhelmingly lost. See, e.g., <a href="https://casetext.com/case/guadamuz-v-ash" target="_blank" rel="noopener noreferrer">Guadamuz v. Ash, 368 F. Supp. 1233</a> (D.D.C. 1973) (OMB <a href="https://www.congress.gov/93/crecb/1973/02/05/GPO-CRECB-1973-pt3-4-2.pdf#page=29" target="_blank" rel="noopener noreferrer">withholding $210.5 million in Rural Environmental Assistance Program funds</a>); <a href="https://law.justia.com/cases/federal/district-courts/FSupp/357/143/2155284/" target="_blank" rel="noopener noreferrer">Berends v. Butz, 357 F. Supp. 143</a> (D. Minn. 1973) (noting OMB apportionment&apos;s cap on funds available to Department of Agriculture).</p>

        <p>President Roosevelt similarly <a href="https://www.google.com/books/edition/Executive_Impoundment_of_Appropriated_Fu/p3ITAAAAIAAJ?hl=en&gbpv=1&pg=PA379&printsec=frontcover" target="_blank" rel="noopener noreferrer">pushed the bounds of the apportionment authority</a>, using it during World War II to halt funding for programs that Congress had enacted into law but that the president deemed non-essential to the war effort. These withholdings prompted blowback from members of Congress and their constituents. Members <a href="https://www.congress.gov/77/crecb/1942/04/02/GPO-CRECB-1942-pt3-7-1.pdf#page=14" target="_blank" rel="noopener noreferrer">took to the House floor</a> and <a href="https://play.google.com/books/reader?id=OIY0AAAAIAAJ&pg=GBS.RA4-PA339&hl=en&q=reserve+fund" target="_blank" rel="noopener noreferrer">used their time in hearings</a> to challenge the legal basis for the withholdings, and <a href="https://www.google.com/books/edition/Executive_Impoundment_of_Appropriated_Fu/p3ITAAAAIAAJ?hl=en&gbpv=1&pg=PA385&printsec=frontcover" target="_blank" rel="noopener noreferrer">directly lobbied the executive branch</a> to change course. <a href="https://www.google.com/books/edition/Executive_Impoundment_of_Appropriated_Fu/p3ITAAAAIAAJ?hl=en&gbpv=1&pg=PA383&printsec=frontcover" target="_blank" rel="noopener noreferrer">In the words of one scholar</a>, the practice of withholding funds also created a &ldquo;feeling of uneasiness&rdquo; among officials in the Bureau of the Budget (OMB&apos;s predecessor and the entity responsible for the withholdings). <a href="https://www.google.com/books/edition/Executive_Impoundment_of_Appropriated_Fu/p3ITAAAAIAAJ?hl=en&gbpv=1&pg=PA383&printsec=frontcover" target="_blank" rel="noopener noreferrer">Some Bureau officials</a> &ldquo;expressed doubt about the Bureau&apos;s legal authority to impound funds&rdquo; and questioned &ldquo;the political wisdom of holding up projects for which Congress had appropriated funds.&rdquo;</p>
      `
    },
    {
      id: 'what-is-tas-tafs',
      question: 'What is a TAS? What is a TAFS?',
      answer: `
        <p>A TAS is a Treasury Account Symbol. A TAFS is a Treasury Appropriation Fund Symbol. A TAS generically describes any account in the Treasury. A TAFS is a particular kind of account, namely one with budget authority &mdash;  authority provided by statute to enter into financial obligations, such as by making payments, borrowing money, or contracting.</p>

        <p>A TAS is composed of a three-digit agency identifier code and a four-digit account-specific code.</p>

        <p><ul>
          <li>The TAS for the Health Care Systems appropriation account is 075 0357. 075 identifies the Department of Health and Human Services as the agency and 0357 identifies Health Care Systems as an account in HHS&apos;s Health Resources and Services Administration.</li>
        </ul></p>

        <p>A TAFS is composed of the three-digit agency identifier code, the four-digit account-specific code, and an additional piece of information: the period of availability of the funding. This period may be annual, or a single fiscal year; multi-year, or multiple fiscal years; or no-year, which means the funds are available until they are expended. No-year accounts are denoted by an X.</p>

        <p><ul>
          <li>For the Health Care Systems account, we see several kinds of TAFS. 075-0357 /X is a no-year account. 075-0357 2020/2022 was a multi-year account with funds available from fiscal year 2020-2022. And 075-0357 /2024 is an annual account with funding available only for fiscal year 2024.</li>
        </ul></p>

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

        <p>After working on budget execution at the Department of Health and Human Services for over 30 years, Ed Martin created a more detailed series of video explainers on apportionments:
          <ul>
            <li><a href="https://www.youtube.com/watch?v=23LQErvq4PE" target="_blank" rel="noopener noreferrer">Module 1</a> defines an apportionment, explains why we apportion, and lays out the basic rules of apportionment. </li>
            <li><a href="https://www.youtube.com/watch?v=Uhkik94uS1g" target="_blank" rel="noopener noreferrer">Module 2</a> covers the apportionment form, the Standard Form (SF) 132. </li>
            <li><a href="https://www.youtube.com/watch?v=fUcCIZQep6U" target="_blank" rel="noopener noreferrer">Module 3</a> examines the rest of the apportionment and the circumstances in which an apportionment is not necessary. </li>
          </ul>
        </p>

        <p>An array of government resources also provide further information about apportionments. </p>

        <p>OMB Circular No. A-11 is the manual behind the federal budget, offering guidance to agencies on budget preparation, submission, and execution. Sections 120, 123, and 124 of A-11 concern apportionments.</p>

        <p><ul>
          <li>Section 120 covers the apportionment process.</li>
          <li>Section 123 covers apportionments under continuing resolutions.</li>
          <li>Section 124 covers agency operations in the absence of appropriations.</li>
          <li>Appendix F covers the format of the Standard Form (SF) 132 (the apportionment form) and SF 133 (the report on budget execution and budgetary resources)</li>
        </ul></p>

        <p>OMB updates Circular A-11 annually. One may find the most up-to-date version here: <a href="https://www.whitehouse.gov/omb/information-for-agencies/circulars/" target="_blank" rel="noopener noreferrer">https://www.whitehouse.gov/omb/information-for-agencies/circulars/</a></p>
      `
    },
    {
      id: 'laws-govern-apportionments',
      question: 'What laws govern apportionments?',
      answer: `
        <p>Congress created the apportionment process in the Antideficiency Act to ensure federal agencies spend within the limits of the law. Failing to follow an apportionment may violate the Antideficiency Act and result in administrative or criminal penalties for the violating official.</p>

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
    <iframe
      src="https://www.youtube.com/embed/videoseries?si=utGqWrbjq0c2E2FW&amp;list=PLZZGlWOJfMoLG7eyzlCkBP0IkuFG-5Y5P"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  </div>

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
          {#each faqs as faq, fi (fi)}
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
  :global(iframe) {
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
