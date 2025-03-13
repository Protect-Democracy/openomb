import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$db/connection';
import { sendVerificationRequest } from '$lib/server/auth-notify';
import { users, accounts, sessions, verificationTokens } from '$db/schema';
import env from '$lib/environment';

const { handle, signIn, signOut } = SvelteKitAuth({
  trustHost: true,
  // Secure cookie https detection may be bugged, so set based on environment
  useSecureCookies: env.environment === 'development' ? false : true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens
  }),
  providers: [
    {
      id: 'http-email',
      name: 'Email',
      type: 'email',
      maxAge: 60 * 60 * 24, // Email link will expire in 24 hours
      sendVerificationRequest
    }
  ],
  pages: {
    verifyRequest: '/subscribe/verify',
    error: '/subscribe/error'
  }
});

// Replace the auth handle function so that our session is an
// unwrapped promise and actually triggers our load functions
const authHandle = handle;

export { authHandle, signIn, signOut };
