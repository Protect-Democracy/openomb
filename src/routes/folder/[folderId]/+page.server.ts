import {
  folderDetails,
  mFilesWithoutTafs,
  mRecentlyApprovedWithTafs,
  mFileCountByMonthByYear
} from '$queries/files';
import { agenciesByFolder } from '$queries/tafs';
import { userSubscription } from '$queries/subscriptions';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, locals }) {
  const folder = await folderDetails(params.folderId);

  if (!folder) {
    error(404, 'Unable to find folder');
  }

  const user = (await locals.auth())?.user;
  const existingSubscription = user
    ? await userSubscription(user.email, 'folder', params.folderId)
    : null;

  return {
    folder,
    agenciesByFolder: await agenciesByFolder(params.folderId),
    filesWithoutTafs: await mFilesWithoutTafs(folder.folderId),
    recentlyApproved: await mRecentlyApprovedWithTafs(20, { folderId: folder.folderId }),
    fileCountByMonthByYear: mFileCountByMonthByYear({ folderId: folder.folderId }),
    user,
    existingSubscription,
    pageMeta: {
      title: `Folder: ${folder.folder}`
    }
  };
}
