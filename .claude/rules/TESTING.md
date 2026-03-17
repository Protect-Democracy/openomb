# Testing

New code should aim for good test coverage. Maintain `docs/TESTING.md` with testing changes.

Run all tests: `npm test`

## Unit tests

Write unit tests for all functions, classes, and components.

- Suffix: `.test.ts`, colocated with the code
- Runner: Vitest
- Helpers:
  - `tests/helpers/db.ts` - Test database setup/teardown and seeding. Avoid test data unless necessary (large, slow).
  - `tests/helpers/fetch.ts` - `mockFetchResponse` for mocking `fetch`
- Commands: `npm run test:unit`, `npm run test:unit:watch`
- Example: `src/lib/searches.test.ts`

## Integration tests

Test browser functionality and system integration.

- Suffix: `.integration-test.ts` in `tests/integration/`
- Runner: Playwright
- Includes a seeded database and running Mailpit server
- Commands: `npm run test:integration`, `npm run test:integration:ui`
- Example: `tests/integration/basics.integration-test.ts`
