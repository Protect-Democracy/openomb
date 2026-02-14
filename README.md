# Apportionments

Web application to make [Office of Management and Budget (OMB) apportionment data](https://apportionment-public.max.gov/) more accessible.

## Usage

### Data collection

To scrape data from the OMB site, use the following command:

```bash
npm run collect
```

Options:

- `--no-archive`: Use if you want to skip the archive (zip) and upload to S3 step.
- `--no-collection`: Use if you want to skip the collection/scraping step.
- `--show-progress`: Show progress of the file collection process

Configure using the following environment variables:

- `APPORTIONMENTS_DB_URI`: Database URI to connect to attempt to load data into.
  - Optionally, instead of using the URI, you can use the variables: `APPORTIONMENTS_DB_HOST`, `APPORTIONMENTS_DB_PORT`, `APPORTIONMENTS_DB_USER`, `APPORTIONMENTS_DB_PASSWORD`, `APPORTIONMENTS_DB_NAME`.
  - If using the non-URI method, you can put the username and password in JSON format as `APPORTIONMENTS_DB_AUTH`. This looks like this if in a `.env` file: `APPORTIONMENTS_DB_AUTH='{"username":"name","password":"pass"}'`
- `APPORTIONMENTS_SENTRY_NODE_DSN` - Sentry DSN for node task reporting.
- `APPORTIONMENTS_ARCHIVE_S3_REGION`: The AWS region code to use for the bucket to upload the archive to.
- `APPORTIONMENTS_ARCHIVE_S3_BUCKET`: The AWS bucket to upload the archive to.
- `APPORTIONMENTS_ARCHIVE_S3_ACL`: ACL to set for the archive upload. Defaults to `public-read`, should be one of `'private' 'public-read', 'public-read-write', 'authenticated-read', 'aws-exec-read', 'bucket-owner-read', 'bucket-owner-full-control'`
- `APPORTIONMENTS_AWS_SSO` - (optional) Whether to use SSO for AWS auth; set to anything besides "false" to enable.
  - For customizing how AWS SSO works, optionally use any of the following variables that align with the [JS SDK fromSSO parameters](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-credential-providers/Variable/fromSSO/).
    - `APPORTIONMENTS_AWS_SSO_PROFILE`
    - `APPORTIONMENTS_AWS_SSO_FILEPATH`
    - `APPORTIONMENTS_AWS_SSO_CONFIG_FILEPATH`
    - `APPORTIONMENTS_AWS_SSO_START_URL`
    - `APPORTIONMENTS_AWS_SSO_ACCOUNT_ID`
    - `APPORTIONMENTS_AWS_SSO_REGION`
    - `APPORTIONMENTS_AWS_SSO_ROLE_NAME`
- `APPORTIONMENTS_AWS_CONTAINER_METADATA` - (optional) Whether to use container metadata method for AWS credentials.

Note that if you want to load environment variables from a local `.env*` file then utilize `dotenvx` like so:

```bash
npx dotenvx run -- npm run collect
```

### Web application

```bash
npm run build && npm run preview
```

Configure using the following environment variables:

- `APPORTIONMENTS_DB_URI`: Database URI to connect to attempt to load data into.
  - Optionally, instead of using the URI, you can use the variables: `APPORTIONMENTS_DB_HOST`, `APPORTIONMENTS_DB_PORT`, `APPORTIONMENTS_DB_USER`, `APPORTIONMENTS_DB_PASSWORD`, `APPORTIONMENTS_DB_NAME`.
  - If using the non-URI method, you can put the username and password in JSON format as `APPORTIONMENTS_DB_AUTH`. This looks like this if in a `.env` file: `APPORTIONMENTS_DB_AUTH='{"username":"name","password":"pass"}'`
- `APPORTIONMENTS_SENTRY_SVELTE_REPORT_URI`: The CSP header value from Sentry.
- `PUBLIC_SENTRY_SVELTE_DSN`: Sentry DSN for the Sveltekit application
- `AUTH_SECRET`: Secret string used for authentication

**TODO**: There are a lot of references to Sentry environment variables in the codebase and in the deployment, but it's unclear on what does what. For instance, these are defined when deploying the web application:

```
VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
VITE_SENTRY_SCRIPT: ${{ secrets.VITE_SENTRY_SCRIPT }}
SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

### Notifications

Use the following command to send notification emails to users who have subscribed to updates:

```bash
npm run notify
```

Configuration needed:

- `APPORTIONMENTS_DB_URI`: (see above)
- TODO

## Setup

See [docs/DEVELOPMENT.md/](./docs/DEVELOPMENT.md).

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## License

Licensed under the [LGPL 3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html); see [LICENSE.txt](./LICENSE.txt) for details.
