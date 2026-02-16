import { expect, test } from '@playwright/test';
import { emailClient } from '$tests/helpers/email';

test('basic email authentication', async ({ page, context, browser, baseURL }) => {
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
