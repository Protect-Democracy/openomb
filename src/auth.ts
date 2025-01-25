import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$db/connection';
import { sendVerificationRequest } from '$lib/server/authNotify';

const { handle, signIn, signOut } = SvelteKitAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db),
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
