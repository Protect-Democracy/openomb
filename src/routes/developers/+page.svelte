<script lang="ts">
  import { formatDate } from '$lib/formatters';
  import type { PageData } from './$types';
  import { siteName, supportEmail } from '$config';

  // Props
  export let data: PageData;

  // Derived
  $: ({ lastUpdated } = data);
</script>

<div class="page-container content-container">
  <h1>Developers and Researchers</h1>

  <p>
    The {siteName} project aims to make the Office of Management and Budget's apportionments data more
    accessible to many different audiences. We know that direct access to our data can be much easier
    to work with than using the website for certain purposes. If you would like to see different methods
    or endpoints to the data, please <a href="mailto:{supportEmail}">contact us</a>.
  </p>

  <p>
    If you would like direct access to the source data, it is available at <a
      href="https://apportionment-public.max.gov/"
      rel="noopener noreferrer">apportionment-public.max.gov</a
    >.
  </p>

  <p>
    Data collection last completed on <strong>{formatDate(lastUpdated?.complete, 'medium')}</strong
    >.
  </p>

  <h2>Bulk downloads</h2>

  <p><em>Coming soon.</em></p>

  <!--
  <p>
    When the original data is scraped from the <a
      href="https://apportionment-public.max.gov/"
      target="_blank"
      rel="noopener noreferrer">OMB site</a
    > we bundle up the raw responses.
  </p>

  <ul>
    <li><a href="/#todo">Bulk Download (2024-01-01 at 4:00am EST)</a></li>
    <li><a href="/#todo">Bulk Download (2024-01-01 at 4:00am EST)</a></li>
    <li><a href="/#todo">Bulk Download (2024-01-01 at 4:00am EST)</a></li>
    <li><a href="/#todo">Bulk Download (2024-01-01 at 4:00am EST)</a></li>
  </ul> -->

  <h2>API</h2>

  <p>
    We provide a basic <acronym title="Application Programming Interface">API</acronym> for developers
    to utilize the data in our applications.
  </p>

  <p>
    It is important to note that we try to avoid altering the original data, but we do some basic
    cleanup and re-structuring of the data for better usability and functionality. For more details
    about how our application works and how our data is processed, please see our <a
      rel="noopener noreferrer"
      href="https://github.com/Protect-Democracy/apportionments/">codebase on Github</a
    >
    and specifically our
    <a
      rel="noopener noreferrer"
      href="https://github.com/Protect-Democracy/apportionments/tree/main/db/schema"
      >database schema files</a
    >.
  </p>

  <h3>General responses</h3>

  Responses from the API will be in JSON format. A successful response will include the following.

  <pre>{`{
  query: {
    ...any query parameters that were provided
  },
  results: ...data
}`}
</pre>

  <h3>Endpoints</h3>

  <table>
    <thead>
      <tr>
        <th>Endpoint</th>
        <th>Description</th>
        <th>Query parameters</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td> <code>/api/v1/files/recent</code></td>
        <td>Get recently approved files.</td>
        <td><code>limit</code> - Limit number of results; defaults to 50; limit is 1000.</td>
      </tr>
      <tr>
        <td> <code>/api/v1/files/[fileId]</code></td>
        <td>Get the details of a single file if you know the <strong>File ID</strong></td>
        <td
          ><code>sourceData</code> - Set to anything to include source data in response; defaults to
          false.</td
        >
      </tr>
      <tr>
        <td> <code>/api/v1/folders</code></td>
        <td>Get the full list of folders.</td>
        <td></td>
      </tr>
      <tr>
        <td> <code>/api/v1/collections</code></td>
        <td>Get a list of completed collections (i.e. scraping runs).</td>
        <td></td>
      </tr>
    </tbody>
  </table>
</div>
