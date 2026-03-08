import { mAgenciesWithChildren } from '$queries/agencies';

/** @type {import('./$types').PageLoad} */
export async function load() {
  const agencyList = await mAgenciesWithChildren();

  return {
    agencies: agencyList,
    pageMeta: {
      title: 'Explore apportionments',
      description: 'Explore apportionments by agencies, bureaus, and accounts',
      includeSearch: true
    }
  };
}
