import { mFileStats } from '$queries/files';
import { mAgenciesWithChildren, tafsStats } from '$queries/tafs';
import { take } from 'lodash-es';

/** @type {import('./$types').PageLoad} */
export async function load() {
  return {
    agencies: take(await mAgenciesWithChildren('approval'), 12),
    fileStats: await mFileStats(),
    tafsStats: await tafsStats(),

    // Most of the defaults are good for the homepage
    pageMeta: {
      title: undefined,
      description: undefined,
      keywords: undefined,
      includeSearch: true
    }
  };
}
