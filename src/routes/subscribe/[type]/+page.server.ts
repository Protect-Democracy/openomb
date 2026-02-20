import { redirect } from '@sveltejs/kit';
// We have to use the devalue library directly
// since deserialize is only available within .svelte files
import { parse } from 'devalue';
import { parseUrlSearchParams } from '$lib/searches';

export const load: PageServerLoad = async ({ params, url, locals, fetch }) => {
  // Get user session
  const user = (await locals.auth())?.user;
  if (!user) {
    // If we don't have a user, it will show the login form again
    return {
      user,
      type: params.type
    };
  }

  if (params.type !== 'search' || !url.searchParams.has('term')) {
    // If this isn't a search, it needs an item id
    // If we don't have search criterion defined, we don't want to save
    redirect(303, '/');
  }

  const criterion = parseUrlSearchParams(url.searchParams);
  const resp = await fetch('/search?/add', {
    method: 'POST',
    headers: {
      'x-sveltekit-action': 'true'
    },
    body: JSON.stringify({ criterion })
  });

  const result = await resp.json();
  if (result.data) {
    const newSearch = parse(result.data);

    // Redirect with item id to add subscription
    if (newSearch.id) {
      redirect(303, `/subscribe/search/${newSearch.id}`);
    }
  }

  return {
    user,
    type: params.type,

    pageMeta: {
      title: `Subscribe to ${params.type}`
    }
  };
};
