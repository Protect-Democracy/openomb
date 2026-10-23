/**
 * Tests for auth-user.ts
 */

// Dependencies
import { expect, test, describe } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { getSessionUser, requireSessionUser } from './auth-user';

// Types
import type { Session } from '@auth/sveltekit';

/**
 * Make request locals with a stubbed Auth.js session.
 */
function makeLocals(session: Session | null): Pick<App.Locals, 'auth'> {
  return { auth: async () => session };
}

const expires = new Date(Date.now() + 60_000).toISOString();

describe('getSessionUser()', () => {
  test('returns null when there is no session', async () => {
    expect(await getSessionUser(makeLocals(null))).toBeNull();
  });

  test('returns null when the session user has no email', async () => {
    expect(await getSessionUser(makeLocals({ expires, user: { name: 'Test' } }))).toBeNull();
  });

  test('returns the user when the session has an email', async () => {
    const user = await getSessionUser(
      makeLocals({ expires, user: { id: 'user-1', email: 'test@example.com' } })
    );
    expect(user).toEqual({ id: 'user-1', email: 'test@example.com' });
  });
});

describe('requireSessionUser()', () => {
  test('throws a 401 when there is no session', async () => {
    const result = await requireSessionUser(makeLocals(null)).catch((e) => e);
    expect(isHttpError(result, 401)).toBe(true);
  });

  test('throws a 401 when the session user has no email', async () => {
    const result = await requireSessionUser(makeLocals({ expires, user: {} })).catch((e) => e);
    expect(isHttpError(result, 401)).toBe(true);
  });

  test('returns the user when signed in', async () => {
    const user = await requireSessionUser(
      makeLocals({ expires, user: { email: 'test@example.com' } })
    );
    expect(user.email).toBe('test@example.com');
  });
});
