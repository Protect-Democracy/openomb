import { mRecentlyAddedOrApprovedWithTafs, mFileCountByMonthByYear } from '$queries/files';
import { getSessionUser } from '$server/auth-user';
import { mAgencyDetails, mBureausByAgency } from '$queries/agencies';
import { userSubscription } from '$queries/subscriptions';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, locals }) {
  const agency = await mAgencyDetails(params.agencyId);
  if (!agency) {
    error(404, 'Unable to find agency');
  }

  const user = await getSessionUser(locals);
  const existingSubscription = user
    ? await userSubscription(user.email || '', 'agency', params.agencyId)
    : null;

  return {
    agency,
    bureausByAgency: await mBureausByAgency(params.agencyId),
    recentApportionments: await mRecentlyAddedOrApprovedWithTafs(20, {
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
