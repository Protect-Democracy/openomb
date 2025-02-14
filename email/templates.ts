/**
 * Email templates and renderer
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { render as svelteRender } from 'svelte/server';
import juice from 'juice';
import reduceCssCalc from 'reduce-css-calc';

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Compile needs to be relative to this file to work across environments
// since we are writing and then importing from
const compileDirectory = path.join(__dirname, '.cache/email-templates');
// TODO: Previously we did fs.readdirSync to get the list of templates, but
// to be able to support Vite builds, we need to know the list of templates
const emailTemplates = ['AuthenticationEmail', 'FileNotificationEmail', 'SubscriptionEmail'];
const htmlTemplate = fs.readFileSync(crossEnvPath('./index.html'), 'utf-8');
const globalStylesToInclude = ['variables.css', 'elements.css', 'components.css', 'utilities.css'];
const globalStyles = globalStylesToInclude.map((file) => {
  return fs.readFileSync(crossEnvPath(`../src/styles/${file}`), 'utf-8');
});

/**
 * Compile all email templates.
 *
 * @param directory
 * @returns
 */
export async function compileTemplates() {
  // Make into a object
  const templates = {};
  for (const templateName of emailTemplates) {
    templates[templateName] = await compileTemplate(templateName);
  }

  return templates;
}

/**
 * Compile an email template.
 *
 * There is not way to do an import .svelte file and Svelte doesn't
 * expose a way to dynamically compile a component in a way that is
 * useful that can handle dependencies.  So we call Vite to compile.
 *
 * TODO: Memoize this.  The memoizing in server/cache.ts i smeant to handle
 * simple data types and this includes functions.
 */
export async function compileTemplate(templateName: string) {
  const filePath = crossEnvPath(`templates/${templateName}.svelte`);
  const text = fs.readFileSync(filePath, 'utf-8');
  const filename = `${templateName}.svelte`;
  const filenameBase = templateName;
  const tempDirectory = path.join(compileDirectory, filename);
  fs.mkdirSync(tempDirectory, { recursive: true });

  // TODO: Make it so that it doesn't output anything unless error
  await build({
    configFile: crossEnvPath('../vite-email.config.ts'),

    build: {
      target: ['node20'],
      ssr: true,
      outDir: tempDirectory,
      lib: {
        entry: filePath,
        name: templateName,
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
    tempLocation: expectedComponent,
    component,
    render: async (props) => {
      return await renderTemplate(component, props);
    }
  };
}

/**
 * Render a component and handle any finessing.
 */
export async function renderTemplate(component, props) {
  let processed;

  // There is html and body (unsure why both but seem to be the same)
  const { head, body } = svelteRender(component, {
    props
  });

  // Put into the larger HTML template
  processed = htmlTemplate.replace(`<!--app-head-->`, head).replace(`<!--app-html-->`, body);

  // Inject global styles
  processed = injectStyles(processed, '<!--app-global-css-->');

  // Inline CSS, resolve variables, and more
  // https://github.com/Automattic/juice
  processed = juice(processed);

  // Juice doesn't fully handle the styles from the global styles
  // so let's get rid of it.
  processed = processed.replace(/<style id="global-styles">.*?<\/style>/s, '');

  // TODO: We may need to do more processing.
  // https://www.caniemail.com/features/
  // https://www.campaignmonitor.com/css/flexbox/align-content/
  //
  // TODO: Somehow convert calc
  processed = remToPx(processed);
  processed = reduceCalc(processed);

  return processed;
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
  return input.replace(
    replacer,
    `
    <style id="global-styles">
      ${globalStyles.join('\n\n')}
    </style>
  `
  );
}

/**
 * Convert rem values to px values.
 *
 * @param {string} input
 * @param {basePixels} number
 */
export function remToPx(input: string, basePixels = 16) {
  return input.replace(/([\d.]+)rem/g, (match, value) => {
    return `${parseFloat(value) * basePixels}px`;
  });
}

/**
 * Reduce calc
 */
export function reduceCalc(input: string) {
  return input.replace(/:([^;]*?calc\([^;]*?);/g, (match, expressionWithCalc) => {
    return `: ${reduceCssCalc(expressionWithCalc)};`;
  });
}

/**
 * Cross env path.
 */
export function crossEnvPath(file: string) {
  // Vite environment
  if (import.meta.env) {
    return path.join('email', file);
  }
  else {
    return path.join(__dirname, file);
  }
}
