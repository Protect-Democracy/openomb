<h1>Developers and Researchers</h1>

<p>
  Intro paragraph here. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lorem ipsum dolor
  sit amet, consectetur adipiscing elit.
</p>

<h2>Bulk downloads</h2>

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
</ul>

<h2>API</h2>

<p>
  We provide a basic <acronym title="Application Programming Interface">API</acronym> for developers
  to utilize the data in their applications.
</p>

<p>
  It is important to note that we try to avoid altering the original data, but we do some basic
  cleanup and re-structuring of the data for better usability and functionality.
</p>

<h3>General responses</h3>

Response from the API will be in JSON format. A successful response will include the following:

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
        ><code>sourceData</code> - Set to anything to include source data in response; defaults to false.</td
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
