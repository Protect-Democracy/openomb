/**
 * Email templates and renderer
 */

import { render as svelteRender } from 'svelte/server';
import juice from 'juice';
import reduceCssCalc from 'reduce-css-calc';
import type { SvelteComponent } from 'svelte';
import globalEmailStyles from '../src/styles/index-email.css?inline';

const htmlTemplate = `
<html lang="en">
  <head>
    <!--app-global-css-->
    <!--app-head-->
    <!--app-css-->
  </head>
  <body>
    <!--app-html-->
  </body>
</html>`;

/**
 * Render a component and handle any finessing.
 */
export function renderTemplate(component: SvelteComponent, props) {
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
function injectStyles(input: string, replacer: string) {
  return input.replace(
    replacer,
    `
    <style id="global-styles">
      ${globalEmailStyles}
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
