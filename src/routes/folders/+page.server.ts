import { dbConnect } from '$db/connection';
import { folders } from '$queries/files';

/** @type {import('./$types').PageLoad} */
export async function load() {
  await dbConnect();

  return {
    folders: await folders(),
    pageMeta: {
      title: `Folders`
    }
  };
}
