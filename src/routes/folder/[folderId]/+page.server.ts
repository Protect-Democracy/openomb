import { dbConnect } from '$db/connection';
import { folderDetails, filesWithoutTafs, recentlyApprovedWithTafs } from '$queries/files';
import { agenciesByFolder } from '$queries/tafs';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  await dbConnect();

  const folder = await folderDetails(params.folderId);

  if (!folder) {
    error(404, 'Unable to find folder');
  }

  return {
    folder,
    agenciesByFolder: await agenciesByFolder(params.folderId),
    filesWithoutTafs: await filesWithoutTafs(folder.folderId),
    recentlyApproved: await recentlyApprovedWithTafs(20, { folderId: folder.folderId }),
    pageMeta: {
      title: `Folder: ${folder.folder}`
    }
  };
}
