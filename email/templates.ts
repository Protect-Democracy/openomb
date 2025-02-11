/**
 * Email templates and renderer
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { render as svelteRender } from 'svelte/server';
import juice from 'juice';

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compileDirectory = path.join(__dirname, '..', '.cache', 'email-templates');
const htmlTemplate = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

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

  const component = (await import(/* @vite-ignore */ expectedComponent)).default;
  return {
    text,
    location: file,
    tempLocation: expectedComponent,
    component,
    render: async (props) => {
      return renderTemplate(component, {
        props
      });
    }
  };
}

/**
 * Render a component and handle any finessing.
 */
export async function renderTemplate(component, props) {
  // There is html and body (unsure why both but seem to be the same)
  const { head, body } = svelteRender(component, {
    props
  });

  // Put into the larger HTML template
  const html = htmlTemplate.replace(`<!--app-head-->`, head).replace(`<!--app-html-->`, body);

  // Inject global styles
  const styled = injectStyles(html, '<!--app-styles-->');

  // Inline CSS, resolve variables, and more
  // https://github.com/Automattic/juice
  const inlined = juice(styled);

  return inlined;
}

/**
 * Inject certain global styles.
 *
 * Given that email is limited, we can't really depend on the site styles
 * too much.
 *
 * Also, it would be nicer to be able to import these directly, but
 * unsure how to do that.
 */
function injectStyles(input, replacer) {
  // TODO
  return input.replace(replacer, '');
}
