import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import typescriptParser from '@typescript-eslint/parser';
import svelteParser from 'svelte-eslint-parser';

/** @type { import("eslint").Linter.Config } */
export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommended,
  ...svelte.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        extraFileExtensions: ['.svelte']
      },
      globals: {
        ...globals.browser,
        ...globals.es2017,
        ...globals.node
      }
    }
  },
  {
    files: [
      '**/*.svelte',
      '*.svelte',
      // Need to specify the file extension for Svelte 5 with rune symbols
      '**/*.svelte.js',
      '*.svelte.js',
      '**/*.svelte.ts',
      '*.svelte.ts'
    ],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: typescriptParser
      }
    },
    rules: {
      'svelte/valid-compile': 'warn'
    }
  },
  {
    ignores: [
      '**/.DS_Store',
      'node_modules/*',
      'build/*',
      'build-*/*',
      '.svelte-kit/*',
      'package',
      '**/.env',
      '**/.env.*',
      '**/!.env.example',
      '.cache/*',
      'notifications/*',
      // large files
      'test-data/*',
      // Ignore files for PNPM, NPM and YARN
      '**/pnpm-lock.yaml',
      '**/package-lock.json',
      '**/yarn.lock'
    ]
  }
]);
