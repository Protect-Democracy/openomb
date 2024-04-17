import { dbConnect } from '$db/connection';
import { recentlyApproved, recentlyRemoved, folders, approvers } from '$queries/files';

/** @type {import('./$types').PageLoad} */
export async function load() {
  await dbConnect();

  return {
    recentlyRemoved: await recentlyRemoved(),
    recentlyApproved: await recentlyApproved(),
    folders: await folders(),
    approvers: await approvers()
  };
}
