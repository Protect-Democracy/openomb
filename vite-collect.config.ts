/**
 * Vite config for compiling/building the bin/collect.ts script
 *
 * TODO: Ideally we could combine with vite-migrate.config.ts
 */
import { resolve } from 'path';
import { defineConfig } from 'vite';

import packageJson from './package.json';

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies
});

export default defineConfig({
  build: {
    target: ['node18'],
    // Note that this directory will get cleared out on build, so combing
    // places with other scripts is not a good idea
    outDir: 'build-collect',
    ssr: resolve(__dirname, 'bin', 'collect.ts'),
    rollupOptions: {
      external: dependencies
    }
  }
});
