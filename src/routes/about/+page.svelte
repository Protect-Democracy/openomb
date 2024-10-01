<script lang="ts">
  import { siteName, contactEmail } from '$config';
</script>

<div class="page-container content-container">
  <h1>About {siteName}</h1>

  <p>
    {siteName} is a searchable database that makes apportionments easier to find and track. Apportionments
    are how the president, acting through the Office of Management and Budget, implements Congress&apos;s
    spending laws. Apportionments set the pace at which agencies may spend appropriated funds over the
    course of a fiscal year by specifying what money an agency may spend, when, and subject to what conditions.
  </p>

  <p>
    Congress created the apportionment process in the Antideficiency Act to ensure agencies spend
    within the limits of the law and do not prematurely exhaust the funds Congress has given them.
    But administrations of both parties have, at times, abused this authority to defy
    Congress&apos;s spending laws &mdash; such as when President Trump&apos;s <acronym
      title="Office of Management and Budget">OMB</acronym
    >
    used the apportionment process
    <a href="https://www.gao.gov/assets/b-331564.pdf" target="_blank" rel="noopener noreferrer"
      >unlawfully to withhold security assistance funds</a
    > that Congress had appropriated for Ukraine.
  </p>

  <p>
    Until July 2022, however, <acronym title="Office of Management and Budget">OMB</acronym> exercised
    its apportionment authority largely out of public view. Neither Congress nor the public had access
    to apportionments.
  </p>

  <p>
    In the Consolidated Appropriations Acts of 2022 and 2023, Congress took action on a bipartisan
    basis to fix this problem. It required <acronym title="Office of Management and Budget"
      >OMB</acronym
    >
    to post its apportionments on a public website. OMB does so at
    <a href="https://apportionment-public.max.gov/" target="_blank" rel="noopener noreferrer"
      >apportionment-public.max.gov</a
    >. But <acronym title="Office of Management and Budget">OMB</acronym>&apos;s website is hard to
    navigate and has no search function, making it difficult to find apportionments and oversee
    OMB&apos;s work.
  </p>

  <p>
    {siteName} aims to make oversight of
    <acronym title="Office of Management and Budget">OMB</acronym>&apos;s apportionments easier for
    Congress, the press, and the public. Drawing on the data files from
    <a href="https://apportionment-public.max.gov/" target="_blank" rel="noopener noreferrer"
      >apportionment-public.max.gov</a
    >, this site makes OMB&apos;s apportionments searchable and easier to find. {siteName} houses all
    of OMB&apos;s public apportionments from fiscal year 2022 to the present. All apportionment files
    on {siteName} simply reflect the underlying, primary-source data and documents that
    <acronym title="Office of Management and Budget">OMB</acronym>
    has made available on
    <a href="https://apportionment-public.max.gov/" target="_blank" rel="noopener noreferrer"
      >apportionment-public.max.gov</a
    >. (For accounts with multiple account-specific apportionments in a given fiscal year, OpenOMB
    has recreated the &ldquo;Previous Approved&rdquo; and &ldquo;Prev Footnote&rdquo; columns based
    on the data OMB disclosed in the prior apportionment.)
  </p>

  <p>
    {siteName} is updated daily. It is maintained by
    <a href="https://protectdemocracy.org/" target="_blank" rel="noopener noreferrer"
      >Protect Democracy Project</a
    >, a nonpartisan nonprofit, and is not affiliated with the Office of Management and Budget
    (OMB), the Executive Office of the President, the U.S. Congress, or any component of the U.S.
    government.
  </p>

  <p>
    For all inquiries, please reach us at <a href="mailto:{contactEmail}">{contactEmail}</a>.
  </p>
</div>

<style>
</style>
