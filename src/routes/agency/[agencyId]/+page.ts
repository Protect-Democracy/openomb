import { getAuthUser } from '$lib/auth';

export async function load({ locals, fetch, data }) {
  const user = await getAuthUser({ locals, fetch });

  return {
    user,
    ...data,
  };
}
