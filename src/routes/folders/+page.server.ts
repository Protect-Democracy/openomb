import { folders } from '$queries/files';

/** @type {import('./$types').PageLoad} */
export async function load() {
  return {
    folders: await folders(),
    pageMeta: {
      title: `Folders`
    }
  };
}
