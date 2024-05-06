import { lastUpdated } from '$queries/collections';

/** @type {import('./$types').PageLoad} */
export async function load() {
  return {
    lastUpdated: await lastUpdated(),
    pageMeta: {
      title: 'Developers and Researchers',
      description:
        'Information for developers in using provided API endpoints to view public OMB apportionment data'
    }
  };
}
