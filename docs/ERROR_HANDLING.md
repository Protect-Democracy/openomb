# Error handling

We want to make sure we are seeing what errors happen in the application. We utilize [Sentry](https://sentry.io/) for this.

## Configuration

The following are relevant environment variables:

- `APPORTIONMENTS_SENTRY_DSN`: Sentry DSN that applies to the `collect` process and web server. If this value is not present then Sentry will not be initialized.
- `VITE_SENTRY_SCRIPT`: The `https://sentry...` script for the Brower project. If this value is not present then Sentry will not be initialized.
- `VITE_SENTRY_DSN`: (not currently used but should be used once SvelteKit support is fully working).

## Current

Given that Svelte 5 integration is not working, this is the current setup:

- The `collect` process utilizes the Sentry Node integration.
- The SvelteKit project utilizes the Sentry Node integration on the server through `hooks.server.ts`
- The browser loads in the Sentry script to broadly handle any errors in the browser.

## Ideal

Sentry provides SvelteKit integration but at this time it does not provide Svelte 5 integration, so that breaks the Svelte integration.

- The `collect` process utilizes the Sentry Node integration.
- SvelteKit errors happens through the Sentry SvelteKit integration. There are notes in the relevant places, but see the [documentation](https://github.com/getsentry/sentry-javascript/blob/develop/packages/sveltekit/README.md). The likely files that need to be updated are the following:
  - `src/hooks.client.ts`
  - `src/hooks.server.ts`
  - `vite.config..ts`

We will want to upload the source maps which requires some [further configuration](https://github.com/getsentry/sentry-javascript/blob/develop/packages/sveltekit/README.md#uploading-source-maps).
