import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import autoprefixer from 'autoprefixer';
import postcssNesting from 'postcss-nesting';
import postcssCustomMedia from 'postcss-custom-media';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    // Sentry configuration
    // Uses v8+ https://docs.sentry.io/platforms/javascript/guides/sveltekit/migration/v7-to-v8/#breaking-sentrysveltekit-changes
    // Must be before sveltkit plugin
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: 'voteshield',
        project: 'pd-apportionments-browser',
        authToken: process.env.SENTRY_AUTH_TOKEN
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
      plugins: [postcssNesting({ noIsPseudoSelector: true }), postcssCustomMedia, autoprefixer]
    }
  },

  test: {
    include: ['{src,server,db}/**/*.{test,spec}.{js,ts}']
  },

  // TODO - this might impact older browsers, but allows our lib env
  // to be used on client and server.  should find a better fix
  esbuild: {
    supported: {
      'top-level-await': true //browsers can handle top-level-await features
    }
  }
});
