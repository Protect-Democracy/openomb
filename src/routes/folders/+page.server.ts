import { mFolders } from '$queries/folders';

/** @type {import('./$types').PageLoad} */
export async function load() {
  return {
    folders: await mFolders(),
    pageMeta: {
      title: `CFO/CIO Act Agencies (Folders)`
    }
  };
}
