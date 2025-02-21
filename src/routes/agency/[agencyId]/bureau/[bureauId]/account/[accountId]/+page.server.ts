import { accountDetails, tafsByAccount } from '$queries/tafs';
import { userSubscription } from '$queries/subscriptions';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params, locals }) {
  const account = await accountDetails(params.agencyId, params.bureauId, params.accountId);
  if (!account) {
    error(404, 'Unable to find bureau');
  }

  const user = (await locals.auth())?.user;
  const existingSubscription = user
    ? await userSubscription(
        user.email,
        'account',
        `${params.agencyId},${params.bureauId},${params.accountId}`
      )
    : null;

  return {
    account,
    tafsByAccount: await tafsByAccount(params.agencyId, params.bureauId, params.accountId),

    user,
    existingSubscription,

    pageMeta: {
      title: `Account: ${account.accountTitle} (Bureau: ${account.bureau.agency.budgetAgencyTitle})`,
      breadcrumbs: [
        {
          title: account.bureau.agency.folder.folder,
          url: `/folder/${account.bureau.agency.folder.folderId}`
        },
        {
          title: account.bureau.agency.budgetAgencyTitle,
          url: `/agency/${account.bureau.agency.budgetAgencyTitleId}`
        },
        {
          title: account.bureau.budgetBureauTitle,
          url: `/agency/${account.bureau.agency.budgetAgencyTitleId}/bureau/${account.bureau.budgetBureauTitleId}`
        }
      ]
    }
  };
}
