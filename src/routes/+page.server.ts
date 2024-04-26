import { dbConnect } from '$db/connection';
import { fileStats } from '$queries/files';
import { agenciesWithChildren } from '$queries/tafs';
import { take } from 'lodash-es';

/** @type {import('./$types').PageLoad} */
export async function load() {
  await dbConnect();

  return {
    agencies: take(await agenciesWithChildren('approval'), 30),
    fileStats: await fileStats(),

    // Most of the defaults are good for the homepage
    pageMeta: {
      title: undefined,
      description: undefined,
      keywords: undefined
    }
  };
}
