import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

// TODO: Sentry's support for Svelte 5 is not complete.
// https://github.com/getsentry/sentry-javascript/issues/10318
//
// import { sentrySvelteKit } from '@sentry/sveltekit';
//
// plugins: [sentrySvelteKit(), sveltekit()],

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['{src,server,db}/**/*.{test,spec}.{js,ts}']
  }
});
