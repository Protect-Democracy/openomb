import { notifierEmailName, notifierEmail } from '$config/subscriptions';
import AuthenticationTemplate from '$components/email/Authentication.svelte';
import { htmlRender } from '@sveltelaunch/svelte-5-email';

// This code only runs on the server, so we want private env variables.
//  (this avoids setting the notifications uri in the client env)
import { environmentVariables } from '../../../server/utilities';

const env = environmentVariables();

/**
 * Send the email that is used to verify and log in a user
 */
export async function sendVerificationRequest(params) {
  const { identifier: to, url, token } = params;
  const urlRef = new URL(url);

  const manageSubscriptionsUrl = `${urlRef.origin}${urlRef.pathname}?callbackUrl=${urlRef.origin}/subscribe&token=${token}&email=${to}`;

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
      html: renderEmail({ authUrl: url, manageSubscriptionsUrl }),
      text: renderEmail({ authUrl: url, manageSubscriptionsUrl }, { plainText: true })
    })
  });

  if (!res.ok) throw new Error('Resend error: ' + JSON.stringify(await res.json()));
}

function renderEmail(
  props: { authUrl: string; manageSubscriptionsUrl: string },
  options: { plainText: boolean } | undefined = undefined
) {
  return htmlRender({
    template: AuthenticationTemplate,
    props,
    options
  });
}
