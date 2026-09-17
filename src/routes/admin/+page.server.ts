import { listUsersPaged, usersFullCount } from '$queries/users';
import { parsePageIndex, parsePageSize } from '$lib/utilities';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const pageSize = parsePageSize(url.searchParams.get('perPage'), 50, 200);
  const pageIndex = parsePageIndex(url.searchParams.get('page'));

  const [userList, userCount] = await Promise.all([
    listUsersPaged({ offset: (pageIndex - 1) * pageSize, limit: pageSize }),
    usersFullCount()
  ]);

  return {
    users: userList,
    userCount,
    pageSize,
    pageIndex,
    pageMeta: { title: 'Admin: Users' }
  };
};
