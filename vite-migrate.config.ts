/**
 * Vite config for compiling/building the bin/migrate.ts script
 *
 * TODO: Ideally we could combine with vite-collect.config.ts
 */
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { sentryRollupPlugin } from '@sentry/rollup-plugin';

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
    outDir: 'build-migrate',
    ssr: resolve(__dirname, 'bin', 'migrate.ts'),
    rollupOptions: {
      external: dependencies,
      output: {
        sourcemap: true
      },
      plugins: [
        // Put the Sentry rollup plugin after all other plugins
        sentryRollupPlugin({
          org: 'voteshield',
          project: 'pd-apportionments-browser',
          authToken: process.env.SENTRY_AUTH_TOKEN
        })
      ]
    }
  }
});
