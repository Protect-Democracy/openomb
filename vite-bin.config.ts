/**
 * Vite config for compiling/building bin/* scripts script
 */
import { defineConfig } from 'vite';
import { sentryRollupPlugin } from '@sentry/rollup-plugin';

import packageJson from './package.json';

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies
});

export default defineConfig({
  // TODO: Unsure why these aliases are not being picked up via
  // the tsconfig.json.  This is a workaround.
  resolve: {
    alias: {
      $config: 'src/config/index.ts',
      '$config/*': 'src/config/*'
    }
  },
  build: {
    target: ['node20'],
    // Use --outDir to specify the output directory
    //outDir: 'build-migrate',
    // Pass in --ssr to build a bin/* script
    //ssr: resolve(__dirname, 'bin', 'migrate.ts'),
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
