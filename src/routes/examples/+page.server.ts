import { recentlyApproved, recentlyRemoved, folders, approvers } from '$queries/files';
import { userSubscriptionListDetails } from '$queries/subscriptions';
import { renderTemplate } from '$email/render';
import SubscriptionEmail from '$email/templates/SubscriptionEmail.svelte';
import FileNotificationEmail from '$email/templates/FileNotificationEmail.svelte';
import AuthenticationEmail from '$email/templates/AuthenticationEmail.svelte';
import previewData from './file-notification-preview-data.json';

/** @type {import('./$types').PageLoad} */
export async function load({ locals }) {
  const user = (await locals.auth())?.user;

  const existingSubscriptions = user ? await userSubscriptionListDetails(user.email) : [];

  return {
    recentlyRemoved: await recentlyRemoved(),
    recentlyApproved: await recentlyApproved(),
    folders: await folders(),
    approvers: await approvers(),
    user,
    existingSubscriptions,
    emailExamples: {
      AuthenticationEmail: renderTemplate(AuthenticationEmail),
      SubscriptionEmail: renderTemplate(SubscriptionEmail),
      FileNotificationEmail: renderTemplate(FileNotificationEmail, { subscriptions: previewData })
    }
  };
}
