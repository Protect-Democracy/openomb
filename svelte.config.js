import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),

    alias: {
      $db: 'db',
      $schema: 'db/schema',
      $queries: 'db/queries',
      $lib: 'src/lib',
      $assets: 'src/assets'
    },

    csp: {
      directives: {
        'script-src': ['self', 'https://browser.sentry-cdn.com'],
        // Doesn't seem like SvelteKit will handle inline styles by adding
        // a nonce like it does for JS, which is unfortunate.
        'style-src': ['self', 'unsafe-inline'],
        'font-src': ['self'],
        'connect-src': ['self', '*.sentry.io'],
        'img-src': ['self'],
        'frame-src': ['self']
        // TODO: Add report-uri to Sentry
        // See: https://docs.sentry.io/product/security-policy-reporting/#content-security-policy
      }
    }
  }
};

export default config;
