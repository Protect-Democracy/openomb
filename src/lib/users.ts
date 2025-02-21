/**
 * Methods for user and auth.
 */

export type User = {
  email: string;
  name: string;
  image: string;
};

export type Subscription = {
  id: string;
  userId: string;
  type: string;
  itemId: string;
  frequency: string;
  description: string;
  itemDetails: Record<string, unknown>;
  itemLink: string;
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

export async function clientGetSubscriptionById(
  type: string,
  itemId: string,
  quiet = true
): Promise<Subscription | null> {
  try {
    const subResp = await fetch(`/api/v1/user/subscription/${type}/${itemId}`);
    const subJson = await subResp.json();
    if (subJson && subJson.results) {
      return subJson.results.subscription || null;
    }
  }
  catch (e) {
    if (quiet) {
      console.error('Error fetching subscription data', e);
    }
    else {
      throw e;
    }
  }

  return null;
}

export async function clientGetSubscriptionBySearchParams(
  searchParams: URLSearchParams,
  quiet = true
): Promise<Subscription | null> {
  try {
    const subResp = await fetch(`/api/v1/user/subscription/search?${searchParams.toString()}`);
    const subJson = await subResp.json();
    if (subJson && subJson.results) {
      return subJson.results.subscription || null;
    }
  }
  catch (e) {
    if (quiet) {
      console.error('Error fetching subscription data', e);
    }
    else {
      throw e;
    }
  }

  return null;
}
