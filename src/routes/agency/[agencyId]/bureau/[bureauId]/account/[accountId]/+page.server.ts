import { dbConnect } from '$db/connection';
import { accountDetails, tafsByAccount } from '$queries/tafs';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  await dbConnect();

  const account = await accountDetails(params.agencyId, params.bureauId, params.accountId);

  if (!account) {
    error(404, 'Unable to find bureau');
  }

  return {
    account,
    tafsByAccount: await tafsByAccount(params.agencyId, params.bureauId, params.accountId)
  };
}
