import { mRecentlyApprovedWithTafs, mFileCountByMonthByYear } from '$queries/files';
import { bureauDetails, accountsByBureau } from '$queries/tafs';
import { userSubscription } from '$queries/subscriptions';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, locals }) {
  const bureau = await bureauDetails(params.agencyId, params.bureauId);
  if (!bureau) {
    error(404, 'Unable to find bureau');
  }

  const user = (await locals.auth())?.user;
  const existingSubscription = user
    ? await userSubscription(user.email, 'bureau', `${params.agencyId},${params.bureauId}`)
    : null;

  return {
    bureau,
    accountsByBureau: await accountsByBureau(params.agencyId, params.bureauId),
    recentlyApproved: await mRecentlyApprovedWithTafs(20, {
      agencyId: params.agencyId,
      bureauId: params.bureauId
    }),
    fileCountByMonthByYear: await mFileCountByMonthByYear({
      agencyId: params.agencyId,
      bureauId: params.bureauId
    }),

    user,
    existingSubscription,

    pageMeta: {
      title: `Bureau: ${bureau.budgetBureauTitle} (Agency: ${bureau.agency.budgetAgencyTitle})`,
      breadcrumbs: [
        {
          title: bureau.agency.folder.folder,
          url: `/folder/${bureau.agency.folder.folderId}`
        },
        {
          title: bureau.agency.budgetAgencyTitle,
          url: `/agency/${bureau.agency.budgetAgencyTitleId}`
        }
      ]
    }
  };
}
