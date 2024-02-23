# Apportionments

Web application to make [Office of Management and Budget (OMB) apportionment data](https://apportionment-public.max.gov/) more accessible.

## Usage

### Data collection

To scrape data from the OMB site, use the following command:

```bash
npm run collect-data
```

Use the following parameters:

- `--no-database`
- `--cache-time`
- `--archive-location`

Configure using the following environment variables:

- `APPORTIONMENT_DB_URI`: Database URI to connect to attempt to load data into.

### Web application

(TODO, how to run web application)

## Setup

See [docs/DEVELOPMENT.md/](./docs/DEVELOPMENT.md).

## Contributing

See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## License

Licensed under the [LGPL 3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html); see [LICENSE.txt](./LICENSE.txt) for details.
