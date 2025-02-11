import Preview from './previews/Preview.svelte';
import { renderTemplate } from './templates.ts';

/**
 * @param {string} _url
 */
export function render(_url) {
  return renderTemplate(Preview, {
    url: _url
  });
}
