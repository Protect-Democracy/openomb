import { mFileStats, recentlyApprovedWithTafs } from '$queries/files';
import { tafsStats } from '$queries/tafs';

/** @type {import('./$types').PageLoad} */
export async function load() {
  return {
    recentFiles: await recentlyApprovedWithTafs(10),
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
