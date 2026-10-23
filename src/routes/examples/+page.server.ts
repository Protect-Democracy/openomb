import { userSubscriptionListDetails } from '$queries/subscriptions';
import { getSessionUser } from '$server/auth-user';
import { renderTemplate } from '$email/render';
import SubscriptionEmail from '$email/templates/SubscriptionEmail.svelte';
import FileNotificationEmail from '$email/templates/FileNotificationEmail.svelte';
import AuthenticationEmail from '$email/templates/AuthenticationEmail.svelte';
import previewData from './file-notification-preview-data.json';

/** @type {import('./$types').PageLoad} */
export async function load({ locals }) {
  const user = await getSessionUser(locals);

  const existingSubscriptions = user ? await userSubscriptionListDetails(user.email) : [];

  return {
    pageMeta: {
      title: 'Examples'
    },
    user,
    existingSubscriptions,
    emailExamples: {
      AuthenticationEmail: renderTemplate(AuthenticationEmail, {
        authUrl: 'https://example.com/',
        subscriptionsUrl: 'https://example.com/'
      }),
      SubscriptionEmail: renderTemplate(SubscriptionEmail, {
        authUrl: 'https://example.com/',
        subscriptionsUrl: 'https://example.com/'
      }),
      FileNotificationEmail: renderTemplate(FileNotificationEmail, { subscriptions: previewData })
    }
  };
}
