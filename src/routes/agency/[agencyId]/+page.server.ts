import { dbConnect } from '$db/connection';
import { agencyDetails, bureausByAgency } from '$queries/tafs';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  await dbConnect();

  const agency = await agencyDetails(params.agencyId);

  if (!agency) {
    error(404, 'Unable to find agency');
  }

  return {
    agency,
    bureausByAgency: await bureausByAgency(params.agencyId),
    pageMeta: {
      title: `Agency: ${agency.budgetAgencyTitle}`
    }
  };
}
