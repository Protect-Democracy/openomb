/**
 * Vite config for compiling/building bin/* scripts script
 */
import { defineConfig } from 'vite';
import { sentryRollupPlugin } from '@sentry/rollup-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

import packageJson from './package.json';

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies
});

export default defineConfig({
  // TODO: tsconfigPaths() does not work like intended, so we have to duplicate the paths in
  // the resolve config.  Specifically JUST the ones that are used in the bin/*.ts files, not
  // necessarily all of them.
  resolve: {
    alias: {
      $email: path.resolve('./src/lib/server/email'),
      $db: path.resolve('./src/lib/server/db'),
      $server: path.resolve('./src/lib/server'),
      $queries: path.resolve('./src/lib/server/db/queries'),
      $schema: path.resolve('./src/lib/server/db/schema'),
      $config: path.resolve('./src/config')
    }
  },

  plugins: [
    // This should allow us to use the tsconfig for paths, which should use
    // the paths defined in SvelteKit config.
    tsconfigPaths({
      projectDiscovery: 'eager'
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
    target: ['node24'],
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
          project: 'pd-apportionments-node',
          authToken: process.env.SENTRY_AUTH_TOKEN,
          release: { name: process.env.SENTRY_RELEASE }
        })
      ]
    }
  }
});
