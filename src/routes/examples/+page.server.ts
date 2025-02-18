import { recentlyApproved, recentlyRemoved, folders, approvers } from '$queries/files';
import { mUserSubscriptionListDetails } from '$queries/subscriptions';

/** @type {import('./$types').PageLoad} */
export async function load({ locals }) {
  const user = (await locals.auth())?.user;

  const existingSubscriptions = user ? await mUserSubscriptionListDetails(user.email) : [];

  return {
    recentlyRemoved: await recentlyRemoved(),
    recentlyApproved: await recentlyApproved(),
    folders: await folders(),
    approvers: await approvers(),
    user,
    existingSubscriptions
  };
}
