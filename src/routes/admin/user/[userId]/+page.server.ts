import { error } from '@sveltejs/kit';
import { getUserById } from '$queries/users';
import { userSubscriptionListDetails } from '$queries/subscriptions';
import { userSearchListDetails } from '$queries/search';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const viewedUser = await getUserById(params.userId);
  if (!viewedUser || !viewedUser.email) {
    error(404, 'Unable to find user');
  }

  const [subscriptions, searches] = await Promise.all([
    userSubscriptionListDetails(viewedUser.email),
    userSearchListDetails(viewedUser.email)
  ]);

  return {
    viewedUser,
    subscriptions,
    searches,
    pageMeta: { title: `Admin: ${viewedUser.email}` }
  };
};
