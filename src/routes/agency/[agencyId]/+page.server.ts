import { mRecentlyApprovedWithTafs, mFileCountByMonthByYear } from '$queries/files';
import { agencyDetails, bureausByAgency } from '$queries/agencies';
import { mRecentlyAdded } from '$queries/spend-plans';
import { userSubscription } from '$queries/subscriptions';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, locals }) {
  const agency = await agencyDetails(params.agencyId);
  if (!agency) {
    error(404, 'Unable to find agency');
  }

  const user = (await locals.auth())?.user;
  const existingSubscription = user
    ? await userSubscription(user.email, 'agency', params.agencyId)
    : null;

  return {
    agency,
    bureausByAgency: await bureausByAgency(params.agencyId),
    recentlyApproved: await mRecentlyApprovedWithTafs(20, {
      agencyId: params.agencyId
    }),
    recentSpendPlans: await mRecentlyAdded(20, {
      agencyId: params.agencyId
    }),
    fileCountByMonthByYear: mFileCountByMonthByYear({
      agencyId: params.agencyId
    }),

    user,
    existingSubscription,

    pageMeta: {
      title: `Agency: ${agency.budgetAgencyTitle}`,
      breadcrumbs: [
        {
          title: agency.folder.folder,
          url: `/folder/${agency.folder.folderId}`
        }
      ]
    }
  };
}
