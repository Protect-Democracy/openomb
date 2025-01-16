import { redirect } from '@sveltejs/kit';
import { deserialize } from '$app/forms';

export const load: PageServerLoad = async ({ params, url, locals, fetch }) => {
  // Get user session
  const user = (await locals.auth())?.user;
  if (!user) {
    // If we don't have a user, it will show the login form again
    return {
      user,
      type: params.type,
      itemId: params.itemId
    };
  }

  if (params.type !== 'search' || !url.searchParams.has('term')) {
    // If this isn't a search, it needs an item id
    // If we don't have search criterion defined, we don't want to save
    redirect(303, '/');
  }

  // Shortcuts
  const u = (p: string) => url.searchParams.get(p);
  const ga = (p: string) => url.searchParams.getAll(p);

  const agencyBureau = url.searchParams.get('agencyBureau')?.split(',');
  const criterion = {
    term: u('term') || '',
    tafs: u('tafs') || '',
    bureau: agencyBureau?.[1] || '',
    agency: agencyBureau?.[0] || '',
    account: u('account') || '',
    approver: ga('approver').join(',') || '',
    year: ga('year').join(','),
    approvedStart: u('approvedStart') ? new Date(`${u('approvedStart')}T00:00:00`) : undefined,
    approvedEnd: u('approvedEnd') ? new Date(`${u('approvedEnd')}T23:59:59`) : undefined,
    lineNum: ga('lineNum').join(','),
    footnoteNum: ga('footnoteNum').join(',')
  };

  const resp = await fetch('/search?/add', {
    method: 'POST',
    headers: {
      'x-sveltekit-action': 'true'
    },
    body: JSON.stringify({ criterion })
  });
  const newSearch = deserialize(await resp.text());

  // Redirect with item id to add subscription
  if (newSearch.data.id) {
    redirect(303, `/subscribe/search/${newSearch.data.id}`);
  }
  return {
    user,
    type: params.type,
    itemId: params.itemId
  };
};
