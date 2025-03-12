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
  // Ensure secret value is set (set from process to ensure not included/built in client files)
  secret: process.env.AUTH_SECRET,
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
  },
  events: {
    async signIn(message) {
      console.log('auth.signIn', message);
    },
    async signOut(message) {
      console.log('auth.signOut', message);
    },
    async createUser(message) {
      console.log('auth.createUser', message);
    },
    async updateUser(message) {
      console.log('auth.updateUser', message);
    },
    async session(message) {
      console.log('auth.session', message);
    }
  }
});

// Replace the auth handle function so that our session is an
// unwrapped promise and actually triggers our load functions
const authHandle = handle;

export { authHandle, signIn, signOut };
