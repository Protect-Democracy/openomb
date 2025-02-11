import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [
    svelte({
      compilerOptions: {
        css: 'injected'
      }
    })
  ]

  // Note that the build is done programmatically in the email/templates.ts file
});
