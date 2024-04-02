import { dbConnect } from '$db/connection';
import { folderDetails } from '$queries/files';
import { agenciesByFolder } from '$queries/tafs';
import type { PageServerData } from '../$types';
import { error } from '@sveltejs/kit';

export const load: PageServerData = async ({ params }) => {
  await dbConnect();

  const folder = await folderDetails(params.folderId);

  if (!folder) {
    error(404, 'Unable to find folder');
  }

  return {
    folder,
    agenciesByFolder: await agenciesByFolder(params.folderId)
  };
};
