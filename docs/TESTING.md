# Testing

## Running tests

To run all tests, simply run:

```bash
npm test
```

### Unit tests

To run only unit tests, run:

```bash
npm run test:unit
```

### Integration tests

To run only integration tests, run:

```bash
npm run test:integration
```

To see the browser out and for debugging, you can use the Playwright UI with:

```bash
npm run test:integration:ui
```

## Writing tests

### Unit tests

Unit tests are generally meant to test individual functions or components in isolation. They should be in the same folder as the module they are testing, for instance `server/load-file.test.ts` for `server/load-file.ts`. They should also be named with the `.test.ts` suffix.

If the function that is being tested needs to make a `fetch` call, note that the `fetch` function is mocked by default, so you will need to set up a mock response for it. You can use the helper function.

```ts
import { mockFetchResponse } from '../test/helpers/fetch';

mockFetchResponse('{"message": "Hello, world!"}');

mockFetchResponse(
  testArrayBuffer,
  {
    headers: new Headers({ 'Content-Type': 'application/pdf' })
  },
  'arrayBuffer'
);

mockFetchResponse('Not Found', {
  ok: false,
  status: 404,
  headers: new Headers({ 'Content-Type': 'application/json' })
});
```

If you need a database connection for your tests, you can use the `createIsolatedDb` helper function to create a new database connection that is isolated from the main database. Note that this method is creating a new database for each test, but the test Postgres server is shared across tests.

Options include the following:

- `runMigrations`: Whether to run migrations on the new database (default: `true`)
- `loadDefaultSampleData`: Whether to load the default sample data on the new database. Note that loading the sample data is significant and will add seconds onto test runtime. The sample database may change, so your tests should not depend heavily on specific data being present in the database. (default: `false`)

```ts
import createIsolatedDb from '../test/helpers/create-isolated-db';
import { db } from '../db/connection';

// If all tests need a database connection, you can set it up in a beforeAll hook
describe('example()', async () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb({ runMigrations: false });
  });

  afterEach(async () => {
    await dbSetup.teardown();
  });

  it('should do some database things', async () => {
    example();
    const results = db.query.files.findMany({
      where: {
        name: 'example.txt'
      }
    });
    expect(results.length > 0).toBe(true);
  });
});

// Or do it in one test
test('example()', async () => {
  const dbSetup = await createIsolatedDb();
  try {
    example();
    const results = db.query.files.findMany({
      where: {
        name: 'example.txt'
      }
    });
    expect(results.length > 0).toBe(true);
  } finally {
    await dbSetup.teardown();
  }
});
```

### Integration tests

Integration tests are meant to test the interaction between multiple components or modules. They should be placed in the `tests/integration` folder and can be named with the `.integration-test.ts` suffix.

The integration tests use a test Postgres database that has the migrations and the sample data loaded by default. The sample database may change, so your tests should not depend heavily on specific data being present in the database.
