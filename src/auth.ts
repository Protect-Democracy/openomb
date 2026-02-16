import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { Handle } from '@sveltejs/kit';
import { db } from '$db/connection';
import { sendVerificationRequest } from '$lib/server/auth-notify';
import { users, accounts, sessions, verificationTokens } from '$schema';
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

// TODO: A more robust solution here would be to override the link in the email to go to an
// intermediate page that has a "Finish logging in" type of link that uses the login link from
// Auth.  This way, if a client goes to the link it won't matter at all unless it's clicking
// through on the button.

// Replace the auth handle function so that we can handle
//  email validation requests and prevent them using up access codes
const authHandle: Handle = async (props) => {
  // If it is an email client verification request, bypass authentication handle
  // (an email client will not have visited the site before, so should not have this cookie in their headers)
  // Note: this will require the user to request the email and open the link within the same browser
  if (
    Boolean(props.event.url.pathname.match(/^\/(auth|subscribe)\/callback.*/)) &&
    props.event.cookies.get('jsEnabled') == null
  ) {
    // We need to set our auth function to avoid reference errors
    props.event.locals.auth = async () => Promise.resolve({ expires: '' });
    return await props.resolve(props.event);
  }
  return await handle(props);
};

export { authHandle, signIn, signOut };
