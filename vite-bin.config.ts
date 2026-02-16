/**
 * Vite config for compiling/building bin/* scripts script
 */
import { defineConfig } from 'vite';
import { sentryRollupPlugin } from '@sentry/rollup-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tsconfigPaths from 'vite-tsconfig-paths';

import packageJson from './package.json';

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies
});

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projectDiscovery: 'lazy'
    }),
    svelte({
      compilerOptions: {
        css: 'injected'
      }
    })
  ],

  // TODO: This causes issues with running the built script, but specifically
  // for the email tool, we would like this to work so that there's parity.
  // css: {
  //   postcss: {
  //     plugins: [postcssNesting, postcssCustomMedia, autoprefixer]
  //   }
  // },
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
