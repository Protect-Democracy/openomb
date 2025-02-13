import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { imagetools } from 'vite-imagetools';

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  // TODO: These don't seem to work
  resolve: {
    alias: {
      $config: '../src/config/index.ts',
      '$config/*': '../src/config/*'
    }
  },
  plugins: [
    svelte({
      compilerOptions: {
        css: 'injected'
      }
    }),
    imagetools()
  ]

  // Note that the build is done programmatically in the email/templates.ts file
});
