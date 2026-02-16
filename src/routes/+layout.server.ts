import { mUrlIsReachable } from '../lib/server/urls';
import { sourceDataUrl } from '$config';

// Turn off prerendering for all pages by default so that authentication runs
// @todo - is there a better solution than this? may need to adjust
export const prerender = false;

/** @type {import('./$types').PageLoad} */
export async function load() {
  // Check if the main apportionments site is down so we can display a banner if so (cached version)
  return {
    isSourceDown: !(await mUrlIsReachable(sourceDataUrl))
  };
}
