import { mFileStats, mRecentlyApprovedWithTafs, mFileCountByMonthByYear } from '$queries/files';
import { mTafsStats } from '$queries/tafs';

/** @type {import('./$types').PageLoad} */
export async function load() {
  return {
    recentFiles: await mRecentlyApprovedWithTafs(10),
    fileStats: await mFileStats(),
    tafsStats: await mTafsStats(),
    fileCountByMonthByYear: mFileCountByMonthByYear(),

    // Most of the defaults are good for the homepage
    pageMeta: {
      title: 'OpenOMB | Tracking apportionments just got easier',
      description: undefined,
      keywords: undefined,
      includeSearch: true
    }
  };
}
