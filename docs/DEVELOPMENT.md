# Code contributions

To contribute code to this project, the general process is the following:

- (optional) Fork this project if you don't have access to push to this repo directly.
- Make a branch that starts with `feature/`, `bugfix/`, or `maintenance/`.
- Do your development.
- Push your branch and make a Pull Request.

## Developing

### Setup and install

The following is how you setup your development environment to work on this project:

- Install Postgres
  - If on a Mac, a suggestion is [Postgres.app](https://postgresapp.com/).
- Install [NodeJS](https://nodejs.org/en/download).
  - If on a Mac, using Homebrew: `brew install node`
- (suggested) Install [nvm](https://github.com/nvm-sh/nvm)
- Utilize the correct Node version
  - (suggested) Utilize nvm: `nvm use`
- Install dependencies: `npm install`
- Configure (see below)
- Run database setup: `npm run db:migrate`

### Updates

When pulling new code, you should do the following:

- Update dependencies: `npm install`
- Run any database migrations: `npm run db:migrate`

### Configuration

Utilize the following environment variables, optionally using a `.env` file:

- `APPORTIONMENTS_DB_URI`: Database connection URI. This should be a Postgres URI, such as `postgres://user:pass@localhost:5444/database`.

### Code styles and linting

See [docs/CODING_STYLES_LINTING.md](./CODING_STYLES_LINTING.md).

### Writing tests

When writing code, you will likely want to write some tests:

- (instructions here)

## Local development server

To start a development server and open web browser:

```bash
npm run dev -- --open
```

## Running tests

To run tests, you should do the following:

- (instructions here)
