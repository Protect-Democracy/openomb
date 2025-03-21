// Note: This file has to be .js and not .ts.  This limits what can be imported
// here.
//
// See: https://github.com/sveltejs/kit/pull/4031
import adapter from '@sveltejs/adapter-node';
import svelte_preprocess from 'svelte-preprocess';
import autoprefixer from 'autoprefixer';
import postcssNesting from 'postcss-nesting';
import postcssCustomMedia from 'postcss-custom-media';
import { cspHashes } from '@vitejs/plugin-legacy';

// Get report URI
const sentrySvelteReportUri = process.env['APPORTIONMENTS_SENTRY_SVELTE_REPORT_URI'] || '';

// Abstract out the csp directives in case we want to shift to a report only
// strategy.
// https://kit.svelte.dev/docs/configuration#csp
const cspDirectives = {
  'script-src': [
    'self',
    'https://browser.sentry-cdn.com',
    'https://js.sentry-cdn.com',
    'https://cdnjs.cloudflare.com/polyfill/',
    'https://www.googletagmanager.com',
    'nonce-SENTRY_SCRIPT_SETUP',
    'nonce-PROGRESSIVE_JS_CHECK',
    ...cspHashes.map((hash) => `sha256-${hash}`)
  ],
  // Doesn't seem like SvelteKit will handle inline styles by adding
  // a nonce like it does for JS, which is unfortunate.
  'style-src': ['self', 'unsafe-inline'],
  'font-src': ['self'],
  'connect-src': ['self', 'https://*.sentry.io', 'https://www.google-analytics.com/'],
  'img-src': ['self', 'data:'],
  'frame-src': [
    'self',
    'https://www.youtube.com/embed/',
    'https://apportionment-public.max.gov/',
    'https://pdfobject.com/'
  ],
  // Blob seems a bit dangerous here, but SvelteKit and Sentry want to load a blob as worker.
  'worker-src': ['self', 'blob:'],
  'child-src': ['self', 'blob:'],
  // Note: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri
  // https://docs.sentry.io/product/security-policy-reporting/#content-security-policy
  //
  // In theory we should add a `report-to` directive here, but then that requires a separate
  // `Report-To` header.  SvelteKit does not support this automatically so we would have to put that
  // header in another part of the application.  That coupled with the fact that report-uri is actually
  // more supported (though deprecated) means we aren't going to do report-to right now.
  'report-uri': sentrySvelteReportUri ? [sentrySvelteReportUri] : undefined
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors.
  //
  // The default is to use the vite preprocessor:
  // import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
  // preprocess: vitePreprocess(),
  preprocess: [
    svelte_preprocess({
      // Unfortunately we have to add the postcss plugins here
      // so that components will work, as well as in
      // vite.config.ts so global imports can use it. :/
      // TODO: Actually, maybe we don't need this here at all
      // TODO: and just in the vite.config.ts file.
      postcss: {
        plugins: [
          // noIsPseudoSelector, is: doesn't play nice with juice (email css processor)
          postcssNesting({ noIsPseudoSelector: true }),
          postcssCustomMedia(),
          autoprefixer()
        ]
      }
    })
  ],

  kit: {
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter({
      out: 'build-web'
    }),

    alias: {
      $db: 'db',
      $schema: 'db/schema',
      $queries: 'db/queries',
      $lib: 'src/lib',
      $assets: 'src/assets',
      $components: 'src/components',
      $config: 'src/config',
      $email: 'email'
    },

    csp: {
      // https://kit.svelte.dev/docs/configuration#csp
      directives: cspDirectives
      // A very broad way to turn this off and debug is to not use
      // directives, and just use readOnly
      // reportOnly: cspDirectives
    }
  }
};

export default config;
