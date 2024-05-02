import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import autoprefixer from 'autoprefixer';
import postcssNesting from 'postcss-nesting';
import postcssCustomMedia from 'postcss-custom-media';
import legacy from '@vitejs/plugin-legacy';

// TODO: Sentry's support for Svelte 5 is not complete.
// https://github.com/getsentry/sentry-javascript/issues/10318
//
// import { sentrySvelteKit } from '@sentry/sveltekit';
//
// plugins: [sentrySvelteKit(), sveltekit()],

export default defineConfig({
  plugins: [
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

  // Unfortunately we have to add the postcss plugins here
  // so that global imports will use it, as well as in
  // svelte.config.js so component can use it. :/
  css: {
    postcss: {
      plugins: [postcssNesting, postcssCustomMedia, autoprefixer]
    }
  },

  test: {
    include: ['{src,server,db}/**/*.{test,spec}.{js,ts}']
  }
});
