/**
 * Methods for user and auth.
 */

export type User = {
  email: string;
  name: string;
  image: string;
};

export async function clientGetUser(quiet = true): Promise<User | null> {
  try {
    const userResp = await fetch('/api/v1/user');
    const userJson = await userResp.json();
    if (userJson && userJson.results) {
      return userJson.results.user || null;
    }
  }
  catch (e) {
    if (quiet) {
      console.error('Error fetching user data', e);
    }
    else {
      throw e;
    }
  }

  return null;
}
