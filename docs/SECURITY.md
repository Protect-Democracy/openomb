# Security

Various security considerations for the app and when building.

## Content-Security-Policy headers

[Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) (CSP) is used to tell the browser what content, such as JS, CSS, images, can be loaded on the page. This is protecting against some untrusted resource being executed for users.

The goal is to not allow broad groups of things, but only allow targeted resources.

These headers are defined in `svelte.config.ts` and SvelteKit handles these on some level.

**IMPORTANT**: If you are adding the following things, they may be blocked because of this policy. Add specific, targeted, trusted exceptions if needed.

- Iframe embed
- A direct `<script>` tag such as Google Analytics.

## Other security headers

Various other security-related headers are defined in `src/config/index.ts`. These should help with browser security but should not likely effect development.

## npm install scripts

The `.npmrc` file sets `ignore-scripts=true` to prevent arbitrary postinstall scripts from running during `npm install`. Packages that need postinstall scripts (like `esbuild` and `@sentry/cli`) must be explicitly rebuilt with `npm rebuild <package>`.

This applies in both local development and Docker builds. The Dockerfile copies `.npmrc` before `npm install` and runs targeted `npm rebuild` commands for allowlisted packages.

## Docker build secrets

Sensitive values like `SENTRY_AUTH_TOKEN` are passed to Docker builds using BuildKit secrets (`--mount=type=secret`) rather than build args. Build args are visible in image layer history; secrets are not.

## Environment variables

- `APPORTIONMENT_*` variables are accessed at runtime and meant to be only used on the server.
- `VITE_*` variables are embedded in the build and are meant for the client and thus can be accessed by looking at the source code of the site.
