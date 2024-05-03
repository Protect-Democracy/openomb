# Build and deployment

## Overall architecture and infrastructure

This section provides a high-level overview of the architecuture and cloud infrastructure for this project.

The web application is written primarily in Typescript to be run on Node.js. This includes three parts: the web application, a data collection script, and a database migration procedure. Each of those elements in detailed below individually and in their own sections of the code, respectively. The database is meant to be deployed to a PostgreSQL instance.

Infrastructure management is handled with OpenTofu and all AWS infrastructure is maintained through IaC files. The application and its related services is designed to be deployed to Amazon Web Services, though may be able to be adapted to another cloud provider. See the `tofu` directory for details on how the infrastructure is configured.

Testing, building, and deploying is handled through CI/CD managed with GitHub Actions workflows. See the [workflows files](https://github.com/Protect-Democracy/apportionments/tree/main/.github/workflows) for more details on how they work.

Additional configuration is stored in GitHub secrets and AWS Secrets Manager secrets, including the following:

- AWS Account ID (GitHub Secrets)
- Sentry configuration variables (GitHub Secrets and AWS Secrets Manager)
- Amazon RDS user credentials (AWS Secrets Manager)

Secrets Manager secrets are used to configure sensitive values in the OpenTofu files. GitHub Secrets are used in the CI/CD Actions scripts.

## Web application

### Build

To create a build for the web application.

```bash
npm run build:web

# Or run the full build
npm run build
```

### Preview application

To preview the build locally. Note that this will automatically run `dotenvx` to use any variables in a `.env*` file.

```bash
npm run preview:web
```

### Production application

The build process puts the application in the `build/` folder. This means the following will run the application directly and this is the preferred way to do this in production.

```bash
node build/
```

### Configuration

The following are environment variables that can be set:

- `APPORTIONMENTS_DB_URI` - Needed for connection to database
  - Optionally, instead of using the URI, you can use the variables: `APPORTIONMENTS_DB_HOST`, `APPORTIONMENTS_DB_PORT`, `APPORTIONMENTS_DB_USER`, `APPORTIONMENTS_DB_PASSWORD`, `APPORTIONMENTS_DB_NAME`.
  - If using the non-URI method, you can put the username and password in JSON format as `APPORTIONMENTS_DB_AUTH`. This looks like this if in a `.env` file: `APPORTIONMENTS_DB_AUTH='{"username":"name","password":"pass"}'`
- `APPORTIONMENTS_SENTRY_DSN` - Sentry DSN for node process.
- `VITE_SENTRY_SCRIPT` - The `https://sentry...` script to load on the page.
- `VITE_SENTRY_DSN` - (not used, see [ERROR_HANDLING.md](./ERROR_HANDLING.md))

This project uses [@dotenvx/dotenvx](https://dotenvx.com/docs) to parse our `.env` files.

This means that any additional commands to run the project code must be prefixed with `dotenvx run -- `

### Deploy

Deployment is handled by GitHub Actions automatically on `release`. See the [GitHub Actions deployment workflow](https://github.com/Protect-Democracy/apportionments/blob/main/.github/workflows/deploy-to-aws.yaml) for more details.

## Collection

The collection/scraping command is handled through a Typescript script. It can be run with the following:

```bash
npm run collect

# Or to read .env files
npx dotenvx run -- npm run collect
```

### Configuration

The following are environment variables that can be set:

- `APPORTIONMENTS_DB_URI` - Needed for connection to database.
  - Optionally, instead of using the URI, you can use the variables: `APPORTIONMENTS_DB_HOST`, `APPORTIONMENTS_DB_PORT`, `APPORTIONMENTS_DB_USER`, `APPORTIONMENTS_DB_PASSWORD`, `APPORTIONMENTS_DB_NAME`.
  - If using the non-URI method, you can put the username and password in JSON format as `APPORTIONMENTS_DB_AUTH`. This looks like this if in a `.env` file: `APPORTIONMENTS_DB_AUTH='{"username":"name","password":"pass"}'`
- `APPORTIONMENTS_ARCHIVE_S3_REGION` - S3 bucket region for uploading the collection archive.
- `APPORTIONMENTS_ARCHIVE_S3_BUCKET` - S3 bucket name for uploading the collection archive.
- `APPORTIONMENTS_ARCHIVE_S3_ACL` - S3 bucket ACL for uploading the collection archive.
- `APPORTIONMENTS_AWS_SSO` - Whether to use SSO for AWS auth.
- `APPORTIONMENTS_SENTRY_DSN` - Sentry DSN for node process.

### Build

To build a `node`-friendly version of the collect command, utilize the following:

```bash
npm run build:collect

# Or run the full build
npm run build
```

### Deploy

Deployment is handled by GitHub Actions automatically on a timed schedule. See the [GitHub Actions collect data workflow](https://github.com/Protect-Democracy/apportionments/blob/main/.github/workflows/collect-data.yaml) for more details.

## Migrate

The database migration command is handled through a Typescript script. It can be run with the following:

```bash
npm run db:migrate

# Or to read .env files
npx dotenvx run -- npm run db:migrate
```

### Configuration

The following are environment variables that can be set:

- `APPORTIONMENTS_DB_URI` - Needed for connection to database.
  - Optionally, instead of using the URI, you can use the variables: `APPORTIONMENTS_DB_HOST`, `APPORTIONMENTS_DB_PORT`, `APPORTIONMENTS_DB_USER`, `APPORTIONMENTS_DB_PASSWORD`, `APPORTIONMENTS_DB_NAME`.
  - If using the non-URI method, you can put the username and password in JSON format as `APPORTIONMENTS_DB_AUTH`. This looks like this if in a `.env` file: `APPORTIONMENTS_DB_AUTH='{"username":"name","password":"pass"}'`

### Build

To build a `node`-friendly version of the collect command, utilize the following:

```bash
npm run build:migrate

# Or run the full build
npm run build
```

### Deploy

Deployment is handled by GitHub Actions automatically on release after a successful deployment if changes are detected in the `db/migrations` directory. See the [GitHub Actions database migration workflow](https://github.com/Protect-Democracy/apportionments/blob/main/.github/workflows/migrate-db.yaml) for more details.
