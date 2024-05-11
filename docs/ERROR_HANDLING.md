# Error handling

We want to make sure we are seeing what errors happen in the application. We utilize [Sentry](https://sentry.io/) for this.

## Configuration

The following are relevant environment variables:

- `APPORTIONMENTS_SENTRY_NODE_DSN`: Sentry DSN that applies to the `collect` and `migrate` processes. If this value is not present then Sentry will not be initialized.
- `VITE_SENTRY_DSN`: Sentry DSN that applies to the Sveltekit application (server and client). If this value is not present then Sentry will not be initialized.
- `APPORTIONMENTS_SENTRY_SVELTE_REQUEST_URI`: The CSP header value from Sentry. (may be optional for development environment)
- `SENTRY_AUTH_TOKEN`: Authentication token for Sentry. If this is provided to a build process, the source code maps will also be built and provided to Sentry.

## Sentry Integrations

These are the integrations we are currently using for each portion:

- The `collect` process utilizes the Sentry [Node](https://docs.sentry.io/platforms/javascript/guides/node/) integration (via custom instrumentation).
  - To work with ESM modules, requires Node v18.19+
- The `migrate` process utilizes the Sentry [Node](https://docs.sentry.io/platforms/javascript/guides/node/) integration (via custom instrumentation).
  - To work with ESM modules, requires Node v18.19+
- The SvelteKit project utilizes the Sentry [Sveltekit](https://docs.sentry.io/platforms/javascript/guides/sveltekit/#compatibility) integration.
  - To work with Sveltekit v5+, requires integration of v8+

## Custom Sentry Implementation

Because Sentry does not offer auto-instrumentation for node processes unless they are a schedule, we've utilized [custom instrumentation](https://docs.sentry.io/platforms/javascript/guides/node/performance/instrumentation/custom-instrumentation/) to report activity from our node processes.

In order to do this, a set of wrapper utility functions can be found within [`/server/sentry-custom.ts`]('../server/sentry-custom.ts')

**NOTE**: There may be a [known performance issue](https://github.com/getsentry/sentry-javascript/issues/11897). We will want to upgrade when possible if this is the case.

### Usage

Here is the initialization:

```ts
import {
  setupCustomSentry,
  createTransaction,
  createSpan,
  createQuerySpan
} from '../server/sentry-custom';

// This should be called before anything else - even additional exports
setupCustomSentry();

// Other imports, other setup...

// Main process function (we can also await this if need be)
await createTransaction('main-task', async () => {
  // Anything that occurs within this transaction function will be captured
});
```

We can use spans to wrap varous functionality that we wish to view profiling for:

```ts
import {
  createTransaction,
  createSpan
} from '../server/sentry-custom';

sync function someFunction() {
  await createSpan('someFunction', () => {

  });
}


await createTransaction('main-task', async () => {
  // This is handled above
  await someFunction();
})
```

To capture drizzle queries and have them show up as expected, queries will need to be wrapped individually:

```ts
import {
  createTransaction,
  createQuerySpan
} from '../server/sentry-custom';

await createTransaction('db-process', async () => {
  dbConnect();

  await createQuerySpan(
    db.select().from(...)
  );

  dbDisconnect();
});
```

Our transaction and default (non-query) span wrappers also optionally accept a span configuration as the first parameter.
Useful options:

- `name`: Required - this is the descriptive name of the span/transaction
  - This is what is set by the string parameter if a configuration object is not provided
- `op`: The [operation](https://develop.sentry.dev/sdk/performance/span-operations/) value
  - defaults to `function` for transaction and span
- `attributes`: Any data attributes that you wish to set on span/transaction creation
  - Sentry provides their own [suggested conventions](https://develop.sentry.dev/sdk/performance/span-data-conventions/)

```ts

await createTransaction('db-process', async () => {

  await createSpan({ name: 'pg-pool.connect', op: 'db' }, dbConnect);

  await createQuerySpan(
    db.select().from(...)
  );

  await createSpan({ name: 'pg-pool.disconnect', op: 'db' }, dbDisconnect);

});

```

The span is also provided optionally as an argument to the callback so that attributes can be set inline:

```ts
await createTransaction('some-process', async (span) => {
  span.setAttribute('aws.s3.bucket', 'some-bucket-name');

  createSpan('someFunction', async (span) => {
    span.setAttribute('aws.s3.upload_id', 'some-id');
  });
});
```
