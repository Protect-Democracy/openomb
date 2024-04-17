// Dependencies
// import * as Sentry from '@sentry/browser';
// import { isProduction } from '$lib/utilities';

// TODO: Sentry for Svelte 5 does not work yet, but the following code
// should be good enough when it does.  Also note that there is
// some vite configuration as well.
// See: https://github.com/getsentry/sentry-javascript/issues/10318
//
// For now, we are just using the Sentry browser integration with
// a script tag in the app.html template.

// import * as Sentry from '@sentry/sveltekit';
//
// // Only setup Sentry if VITE_SENTRY_DSN is defined
// if (import.meta.env.VITE_SENTRY_DSN) {
//   Sentry.init({
//     dsn: import.meta.env.VITE_SENTRy_DSN,
//     environment: isProduction() ? 'production' : 'development',
//     tracesSampleRate: 1.0
//
//     // TODO: Maybe we want replay integration?
//     // replaysSessionSampleRate: 0.1,
//     // replaysOnErrorSampleRate: 1.0,
//     // integrations: [Sentry.replayIntegration()],
//   });
// }
//
// export const handleError = Sentry.handleErrorWithSentry();
