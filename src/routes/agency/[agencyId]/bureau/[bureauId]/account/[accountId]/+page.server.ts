import { dbConnect } from '$db/connection';
import { accountDetails, tafsByAccount } from '$queries/tafs';
import type { PageServerData } from '../$types';
import { error } from '@sveltejs/kit';

export const load: PageServerData = async ({ params }) => {
  await dbConnect();

  const account = await accountDetails(params.agencyId, params.bureauId, params.accountId);

  if (!account) {
    error(404, 'Unable to find bureau');
  }

  return {
    account,
    tafsByAccount: await tafsByAccount(params.agencyId, params.bureauId, params.accountId)
  };
};
