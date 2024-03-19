import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: 'protect-democracy',
        project: 'apportionments'
      }
    }),
    sveltekit()
  ],
  optimizeDeps: {
    // Needed to support Svelte 5 and Sentry
    // https://github.com/getsentry/sentry-javascript/issues/10275
    // https://github.com/getsentry/sentry-javascript/issues/10318
    exclude: ['@sentry/sveltekit']
  },
  test: {
    include: ['{src,server,db}/**/*.{test,spec}.{js,ts}']
  }
});
