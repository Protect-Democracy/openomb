import { dbConnect } from '$db/connection';
import { agencyDetails, bureausByAgency } from '$queries/tafs';
import type { PageServerData } from '../$types';
import { error } from '@sveltejs/kit';

export const load: PageServerData = async ({ params }) => {
  await dbConnect();

  const agency = await agencyDetails(params.agencyId);

  if (!agency) {
    error(404, 'Unable to find agency');
  }

  return {
    agency,
    bureausByAgency: await bureausByAgency(params.agencyId)
  };
};
