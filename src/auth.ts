import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { Handle } from '@sveltejs/kit';
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

// Replace the auth handle function so that we can handle
//  HEAD requests and prevent them using up access codes
//  https://next-auth.js.org/tutorials/avoid-corporate-link-checking-email-provider
const authHandle: Handle = async (props) => {
  // If it is an email client HEAD request, bypass authentication handle
  if (
    props.event.request.method === 'HEAD' &&
    Boolean(props.event.url.pathname.match(/^\/(auth|subscribe).*/))
  ) {
    return await props.resolve(props.event);
  }
  return await handle(props);
};

export { authHandle, signIn, signOut };
