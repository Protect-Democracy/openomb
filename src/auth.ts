import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$db/connection';
import { sendVerificationRequest } from '$lib/auth';
import { invalidate } from '$app/navigation';
 
const { handle, signIn, signOut } = SvelteKitAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db),
  providers: [
    {
      id: "http-email",
      name: "Email",
      type: "email",
      maxAge: 60 * 60 * 24, // Email link will expire in 24 hours
      sendVerificationRequest,
    },
  ],
  pages: {
    verifyRequest: '/subscribe/verify',
    error: '/subscribe/error',
  }
 /* events: {
    signIn: (values) => {
      console.log('signIn event called', values)
      invalidate('auth');
    },
    signOut: (values) => {
      console.log('signOut event called', values)
      invalidate('auth');
    }
  },*/
})

// Replace the auth handle function so that our session is an
// unwrapped promise and actually triggers our load functions
const authHandles = [
  handle,
  /*async ({ event, resolve }) => {
    event.locals.session = await event.locals.auth();
    console.log('server', event.locals.session);
    return resolve(event);
  }*/
]

export {
  authHandles,
  signIn,
  signOut
}
