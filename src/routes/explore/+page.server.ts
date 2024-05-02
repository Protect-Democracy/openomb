import { dbConnect } from '$db/connection';
import { agenciesWithChildren } from '$queries/tafs';

/** @type {import('./$types').PageLoad} */
export async function load() {
  await dbConnect();

  const agencyList = await agenciesWithChildren();

  return {
    agencies: agencyList,
    pageMeta: {
      title: 'Explore apportionments',
      description: 'Explore apportionments by agencies, bureaus, and accounts',
      includeSearch: true
    }
  };
}
