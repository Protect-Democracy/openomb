import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import autoprefixer from 'autoprefixer';
import postcssNesting from 'postcss-nesting';
import postcssCustomMedia from 'postcss-custom-media';
import postcssIsPseudoClass from '@csstools/postcss-is-pseudo-class';
import legacy from '@vitejs/plugin-legacy';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
  plugins: [
    devtoolsJson(),

    // Sentry configuration
    // Uses v8+ https://docs.sentry.io/platforms/javascript/guides/sveltekit/migration/v7-to-v8/#breaking-sentrysveltekit-changes
    // Must be before sveltkit plugin
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: 'voteshield',
        project: 'pd-apportionments-browser',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: { name: process.env.SENTRY_RELEASE }
      }
    }),

    sveltekit(),

    // Use Babel-env to utilize browserslist for how to transpile.
    // https://www.npmjs.com/package/@vitejs/plugin-legacy
    //
    // Svelte/Kit has limited support for legacy building.
    // https://github.com/sveltejs/kit/pull/6265
    //
    // So, we have to assume some things.
    legacy({
      modernPolyfills: true,
      renderLegacyChunks: false
    })
  ],

  server: {
    watch: {
      // Need to not watch in the cache and build specifically
      // because we dynamically build email templates.  This also means
      // that you may have to restart the server if you change an email
      ignored: ['**/.cache/**', '**/build-*/**']
    }
  },

  // Unfortunately we have to add the postcss plugins here
  // so that global imports will use it, as well as in
  // svelte.config.js so component can use it. :/
  css: {
    postcss: {
      // noIsPseudoSelector, is: doesn't play nice with juice (email css processor)
      plugins: [
        postcssNesting({ noIsPseudoSelector: true }),
        postcssCustomMedia,
        postcssIsPseudoClass,
        autoprefixer
      ]
    }
  },

  test: {
    css: true,
    // Specifically needed because of the use of testcontainers
    hookTimeout: 60_000,
    testTimeout: 5_000,
    setupFiles: ['./tests/vitest.setup.ts'],
    // Unit tests should generally be in the same directory as code.
    include: [
      '{src,server,db,email}/**/*.{test,spec}.{js,ts}',
      'tests/unit/**/*.{test,spec}.{js,ts}'
    ]
  },

  // TODO - this might impact older browsers, but allows our lib env
  // to be used on client and server.  should find a better fix
  esbuild: {
    supported: {
      'top-level-await': true //browsers can handle top-level-await features
    }
  }
});
