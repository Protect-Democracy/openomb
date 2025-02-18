/**
 * Vite config for email rendering and preview.
 */
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        css: 'injected'
      }
    })
  ]

  // Note that the email rendering is done programmatically in the email/templates.ts file
  // and specific values are set there as well.
});
