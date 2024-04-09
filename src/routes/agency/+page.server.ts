import { dbConnect } from '$db/connection';
import { agenciesWithChildren } from '$queries/tafs';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  await dbConnect();

  const agencyList = await agenciesWithChildren();

  return {
    agencies: agencyList,
  };
}
