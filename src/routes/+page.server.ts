import { dbConnect } from '$db/connection';
import { mFileStats } from '$queries/files';
import { mAgenciesWithChildren } from '$queries/tafs';
import { take } from 'lodash-es';

/** @type {import('./$types').PageLoad} */
export async function load() {
  await dbConnect();

  return {
    agencies: take(await mAgenciesWithChildren('approval'), 30),
    fileStats: await mFileStats(),

    // Most of the defaults are good for the homepage
    pageMeta: {
      title: undefined,
      description: undefined,
      keywords: undefined,
      includeSearch: true
    }
  };
}
