# Apportionments

Web application to make [Office of Management and Budget (OMB) apportionment data](https://apportionment-public.max.gov/) more accessible.

## TODO

Sentry does not work with Svelte 5 yet. Specifically it breaks interactivity (i.e. click handlers) on all components and pages.
https://github.com/getsentry/sentry-javascript/issues/10318

## Usage

### Data collection

To scrape data from the OMB site, use the following command:

```bash
npm run collect
```

Configure using the following environment variables:

- `APPORTIONMENTS_DB_URI`: Database URI to connect to attempt to load data into.

**TODO**:

- Create an zip of the cache files after done to be archived on S3 likely.
- Create a minimal caching layer to avoid direct queries when no data has changed. This should be trivial with the collect runs being logged.

### Web application

```bash
npm run build && npm run preview
```

## Setup

See [docs/DEVELOPMENT.md/](./docs/DEVELOPMENT.md).

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## License

Licensed under the [LGPL 3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html); see [LICENSE.txt](./LICENSE.txt) for details.
