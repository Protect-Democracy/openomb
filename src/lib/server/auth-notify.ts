import { notifierEmailName, notifierEmail } from '$config/subscriptions';
import { renderTemplate } from '$email/render';
import AuthenticationEmail from '$email/templates/AuthenticationEmail.svelte';
import SubscriptionEmail from '$email/templates/SubscriptionEmail.svelte';

// This code only runs on the server, so we want private env variables.
//  (this avoids setting the notifications uri in the client env)
import { environmentVariables } from '../../../server/utilities';

// Constants
const env = environmentVariables();

/**
 * Send the email that is used to verify and log in a user
 */
export async function sendVerificationRequest(params) {
  const { identifier: to, url, token } = params;
  const urlRef = new URL(url);

  // Make URL that will log them in and go directly to the subscribe page
  const manageSubscriptionsUrl = `${urlRef.origin}${urlRef.pathname}?callbackUrl=${urlRef.origin}/subscribe&token=${token}&email=${to}`;

  // If they are trying to auth via a subscribe link, we need to send a different email
  const template = isSubscribeLink(urlRef) ? SubscriptionEmail : AuthenticationEmail;

  // Render the email
  const htmlRender = renderTemplate(template, {
    authUrl: url,
    subscriptionsUrl: manageSubscriptionsUrl
  });

  const res = await fetch(`${env.notificationsServiceUri}/email/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: notifierEmail,
      from_name: notifierEmailName,
      to,
      title: `Subscribe to OpenOMB`,
      html: htmlRender
      //text: renderEmail({ authUrl: url, manageSubscriptionsUrl }, { plainText: true })
    })
  });

  if (!res.ok) {
    throw new Error('Resend error: ' + JSON.stringify(await res.json()));
  }
}

/**
 * Determine if the auth email is a direct subscribe link.
 *
 * TODO: This seems a little brittle.
 */
function isSubscribeLink(url) {
  const callbackUrl = url?.searchParams.get('callbackUrl');
  return callbackUrl && callbackUrl.match(/\/subscribe\/[a-z]+/);
}
