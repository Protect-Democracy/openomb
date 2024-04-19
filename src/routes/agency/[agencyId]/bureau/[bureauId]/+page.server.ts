import { dbConnect } from '$db/connection';
import { bureauDetails, accountsByBureau } from '$queries/tafs';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  await dbConnect();

  const bureau = await bureauDetails(params.agencyId, params.bureauId);

  if (!bureau) {
    error(404, 'Unable to find bureau');
  }

  return {
    bureau,
    accountsByBureau: await accountsByBureau(params.agencyId, params.bureauId),
    pageMeta: {
      title: `Bureau: ${bureau.budgetBureauTitle} (Agency: ${bureau.agency.budgetAgencyTitle})`
    }
  };
}
