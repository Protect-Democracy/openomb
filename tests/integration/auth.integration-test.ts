import { expect, test } from '@playwright/test';
import { integrationAuthenticate } from '$tests/helpers/authenticate';
import { createApportionment } from '$tests/helpers/apportionment';
import { runNotifyCommand } from '$tests/helpers/notify';
import { subscriptionsByUser } from '$queries/subscriptions';
import { db } from '$db/connection';
import { subscriptions } from '$schema/subscriptions';
import { sql, eq } from 'drizzle-orm';
import { emailClient } from '$tests/helpers/email';

// NOTE: We put all these tests here because they use the test email service, which is
// shared.  Specifically if we look for new messages, if tests are done in parallel, then
// we might not get the message we are expecting.
//
// TODO: Move to Playwright projects, which can specify parallel and serial.

test('basic email authentication', async ({ page, context, baseURL }) => {
  const { client: mailClient, teardown: emailTeardown } = await emailClient();
  const newEmailWatch = mailClient.waitForEvent('new');

  // Set a cookie to indicate that the user has JavaScript enabled, which is required for
  // our email verification flow
  await context.addCookies([
    {
      name: 'jsEnabled',
      value: 'true',
      url: baseURL
    }
  ]);

  // Subscribe / login
  await page.goto('/subscribe');

  // Fill in email
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByRole('button', { name: 'Send link' }).click();

  // Wait for the confirmation email
  const email = await newEmailWatch;

  // Check subject
  expect(email.Data.Subject).toContain('Subscribe to OpenOMB');

  // Get the link from the email
  const emailHtml = await mailClient.renderMessageHTML(email.Data.ID);
  const linkMatch = emailHtml.match(/"(https?:\/\/[^\s]+auth\/callback[^\s]+)"/im);
  if (!linkMatch) {
    throw new Error('No link found in email');
  }
  let authLink = linkMatch[1];

  // Check link
  expect(authLink).not.toBeNull();
  expect(authLink).toMatch(/^http/);

  // Ensure that any HTML entities in the link are decoded (e.g. &amp; to &)
  authLink = authLink.replace(/&amp;/g, '&');

  // Go to the link to log in
  await page.goto(authLink);
  await expect(page.getByRole('heading', { name: 'Subscriptions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Modify subscriptions' })).toBeVisible();

  // Teardown email client
  await emailTeardown();
});

test('basic notification test', async ({ page, context, baseURL }) => {
  const email = 'test-notification-test@example.com';
  const auth = await integrationAuthenticate(email, page, context, baseURL);

  // Go to a search page for apportionments that are approved after 3 months agon
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
  await page.goto(`/search?approvedStart=${threeMonthsAgoStr}`);

  // Make sure that the .file-list has more than one <article> in it
  const articles = page.locator('.file-list article');
  expect(await articles.count()).toBeGreaterThan(0);

  // If running again without a reset, then the subscription may still exist, so check for the button
  if (await page.getByRole('button', { name: 'Subscribe', exact: true }).isVisible()) {
    // Press subscribe button
    await page.getByRole('button', { name: 'Subscribe' }).click();
  }

  // Button should change to "Unsubscribe"
  await expect(page.getByRole('button', { name: 'Unsubscribe' })).toBeVisible();

  // Check that subscription is on subscriptions page.  Look for link with "Approved After: "
  await page.goto('/subscribe');
  await expect(page.getByRole('link', { name: /Approved After: / })).toBeVisible();

  // Add new apportionment
  await createApportionment({ approvalTimestamp: new Date() }, [{ accountTitle: 'Test Account' }]);

  // Notifications won't go out until 18 hours after the subscription was created, so we need to
  // update the subscription to be old enough to trigger a notification.
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email)
  });
  const search = await db.query.searches.findFirst({
    where: (searches, { eq }) =>
      eq(searches.userId, user?.id || '') &&
      sql`${searches.criterion}::jsonb @> ${JSON.stringify({ approvedStart: threeMonthsAgoStr })}::jsonb`
  });
  const subscription = await db.query.subscriptions.findFirst({
    where: (subs, { eq }) => eq(subs.userId, user?.id || '') && eq(subs.itemId, search?.id || '')
  });
  expect(subscription).toBeDefined();
  await db
    .update(subscriptions)
    // 24 hours ago
    .set({ lastNotifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24) })
    .where(eq(subscriptions.id, subscription?.id || ''));

  // See if the new apportionment shows up in the subscriptionsByUser query results
  const userSubscriptions = await subscriptionsByUser();
  const currentUserSubs = userSubscriptions[email];
  expect(currentUserSubs).toBeDefined();
  expect(currentUserSubs.length).toBeGreaterThan(0);
  const sub = currentUserSubs[0];
  expect(sub).toBeDefined();

  // Notify
  const newEmailWatch = auth.mailClient.waitForEvent('new', 10000);
  const notifyOutput = await runNotifyCommand();

  // Wait for email and check that it has the new apportionment in it
  const emailData = await newEmailWatch;
  expect(emailData.Data.Subject).toContain('Subscriptions');
  const emailHtml = await auth.mailClient.renderMessageHTML(emailData.Data.ID);
  expect(emailHtml).toContain('Test Account');

  // Teardown
  await auth.teardown();
});
