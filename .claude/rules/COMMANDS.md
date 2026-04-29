# Commands

- `dev:*` scripts run source via `tsx` with `dotenvx` for local `.env` loading.
- `build:*` scripts compile bin scripts via Vite for deployment.
- Production scripts (no prefix, e.g. `collect`, `notify`) run built output and expect env vars already set.

## Development

| Command                      | Description                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`                | Start the local dev server (alias for `dev:web`)                                    |
| `npm run dev:web`            | Start the SvelteKit dev server with dotenvx env loading                             |
| `npm run dev:migrate`        | Run database migrations locally via dotenvx                                         |
| `npm run dev:generate`       | Generate a new Drizzle migration file locally via dotenvx                           |
| `npm run dev:collect`        | Run the data collection script locally via dotenvx                                  |
| `npm run dev:notify`         | Build and run the notification email script locally via dotenvx                     |
| `npm run dev:test-email`     | Build and run the test email script locally via dotenvx                             |
| `npm run dev:test-data`      | Seed the database with test data locally via dotenvx                                |
| `npm run dev:check-agencies` | Run agency data validation checks locally via dotenvx                               |
| `npm run dev:mailpit`        | Start a Mailpit Docker container for local email testing (SMTP on 1025, UI on 8025) |
| `npm run dev:mailpit:stop`   | Stop and remove the Mailpit Docker container                                        |
| `npm run dev:mailpit:open`   | Open the Mailpit web UI in the browser                                              |

## Build

| Command                    | Description                                       |
| -------------------------- | ------------------------------------------------- |
| `npm run build`            | Build everything: web app and all bin scripts     |
| `npm run build:web`        | Build the SvelteKit web app for production        |
| `npm run build:collect`    | Build the data collection bin script              |
| `npm run build:migrate`    | Build the database migration bin script           |
| `npm run build:notify`     | Build the notification email bin script           |
| `npm run build:test-data`  | Build the test data seeding bin script            |
| `npm run build:test-email` | Build the test email bin script                   |
| `npm run pre-build`        | Run `svelte-kit sync` to generate SvelteKit types |

## Preview

| Command                      | Description                                           |
| ---------------------------- | ----------------------------------------------------- |
| `npm run preview`            | Preview the built web app (alias for `preview:web`)   |
| `npm run preview:web`        | Preview the built web app using Vite's preview server |
| `npm run preview:web:dotenv` | Preview the built web app with dotenvx env loading    |

## Code quality

| Command               | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `npm run check`       | Run svelte-check for TypeScript and Svelte type errors              |
| `npm run check:watch` | Run svelte-check in watch mode                                      |
| `npm run lint`        | Check formatting with Prettier and linting with ESLint (no changes) |
| `npm run lint-staged` | Run lint-staged (used by pre-commit hook)                           |
| `npm run format`      | Auto-fix formatting with Prettier and linting with ESLint           |

## Testing

| Command                       | Description                                             |
| ----------------------------- | ------------------------------------------------------- |
| `npm test`                    | Run all tests (integration first, then unit)            |
| `npm run test:unit`           | Run unit tests with Vitest                              |
| `npm run test:unit:watch`     | Run unit tests in watch mode                            |
| `npm run test:integration`    | Run Playwright integration tests (runs pre-build first) |
| `npm run test:integration:ui` | Run Playwright integration tests with interactive UI    |

## Database

| Command                         | Description                                                              |
| ------------------------------- | ------------------------------------------------------------------------ |
| `npm run db:generate-migration` | Generate a new Drizzle migration file (no dotenvx; expects env vars set) |
| `npm run db:migrate`            | Run database migrations (no dotenvx; expects env vars set)               |

## Production bin scripts

| Command           | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `npm run collect` | Run data collection (no dotenvx; expects env vars set)               |
| `npm run notify`  | Build and run notification emails (no dotenvx; expects env vars set) |

## Utility

| Command             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `npm run csv-to-ts` | Convert a CSV file to a TypeScript module                    |
| `npm run prepare`   | Set up Husky git hooks (runs automatically on `npm install`) |
