import { recentlyApproved, recentlyRemoved, folders, approvers } from '$queries/files';

/** @type {import('./$types').PageLoad} */
export async function load() {
  return {
    recentlyRemoved: await recentlyRemoved(),
    recentlyApproved: await recentlyApproved(),
    folders: await folders(),
    approvers: await approvers()
  };
}
