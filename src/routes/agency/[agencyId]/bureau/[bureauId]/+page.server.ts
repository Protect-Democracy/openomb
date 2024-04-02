import { dbConnect } from '$db/connection';
import { bureauDetails, accountsByBureau } from '$queries/tafs';
import type { PageServerData } from '../$types';
import { error } from '@sveltejs/kit';

export const load: PageServerData = async ({ params }) => {
  await dbConnect();

  const bureau = await bureauDetails(params.agencyId, params.bureauId);

  if (!bureau) {
    error(404, 'Unable to find bureau');
  }

  return {
    bureau,
    accountsByBureau: await accountsByBureau(params.agencyId, params.bureauId)
  };
};
