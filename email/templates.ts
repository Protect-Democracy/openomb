/**
 * Email templates and renderer
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { render as svelteRender } from 'svelte/server';

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compileDirectory = path.join(__dirname, '..', '.cache', 'email-templates');

// Templates
export async function compileTemplates(directory = 'templates') {
  const files = fs.readdirSync(path.join(__dirname, directory));

  // Filter svelte files
  const svelteFiles = files.filter((file) => file.endsWith('.svelte'));

  // Make into a object
  const templates = {};
  for (const file of svelteFiles) {
    const name = file.replace('.svelte', '');
    templates[name] = await compileTemplate(path.join(__dirname, directory, file));
  }

  return templates;
}

// There is not way to do an import .svelte file and Svelte doesn't
// expose a way to dynamically compile a component in a way that is
// useful that can handle dependencies.  So we call Vite to compile.
export async function compileTemplate(file) {
  const text = fs.readFileSync(file, 'utf-8');
  const filename = path.basename(file);
  const filenameBase = filename.replace('.svelte', '');
  const tempDirectory = path.join(compileDirectory, filename);
  fs.mkdirSync(tempDirectory, { recursive: true });

  // TODO: Make it so that it doesn't output anything unless error
  await build({
    configFile: path.join(__dirname, 'vite-email.config.ts'),

    build: {
      target: ['node20'],
      ssr: true,
      outDir: tempDirectory,
      lib: {
        entry: file,
        name: 'EmailTemplate',
        formats: ['es']
      },
      rollupOptions: {
        external: ['svelte']
      }
    }
  });

  const expectedComponent = path.join(tempDirectory, `${filenameBase}.js`);
  const component = (await import(expectedComponent)).default;
  return {
    text,
    location: file,
    tempLocation: expectedComponent,
    component,
    render: async (props) => {
      return svelteRender(component, {
        props
      });
    }
  };
}
