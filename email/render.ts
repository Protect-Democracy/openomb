import { render as _render } from 'svelte/server';
import Preview from './previews/Preview.svelte';

/**
 * @param {string} _url
 */
export function render(_url) {
  return _render(Preview, {
    props: {
      url: _url
    }
    // context
  });
}
