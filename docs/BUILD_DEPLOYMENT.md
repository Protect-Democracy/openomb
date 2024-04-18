# Build and deployment

## Web application

### Build

To create a build:

```bash
npm run build
```

### Preview application

To preview the build locally. Note that this will automatically run `dotenvx` to use any variables in a `.env*` file.

```bash
npm run preview
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

(todo)

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

### Deploy

(todo)
