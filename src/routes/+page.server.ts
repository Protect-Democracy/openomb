import { dbConnect } from '$db/connection';
import { fileStats } from '$queries/files';
import { agenciesWithChildren } from '$queries/tafs';

/** @type {import('./$types').PageLoad} */
export async function load() {
  await dbConnect();

  return {
    agencies: await agenciesWithChildren(),
    fileStats: await fileStats(),
  };
}
