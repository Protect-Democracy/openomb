import { agenciesWithChildren } from '$queries/tafs';

/** @type {import('./$types').PageLoad} */
export async function load() {
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
