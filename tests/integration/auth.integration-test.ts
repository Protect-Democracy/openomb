import { expect, test } from '@playwright/test';
import { emailClient } from '../helpers/email';

test('basic email authentication', async ({ page }) => {
  const { client: mailClient, teardown: emailTeardown } = await emailClient();
  const newEmailWatch = mailClient.waitForEvent('new');

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
  console.log('Auth link:', authLink);

  // Check link
  expect(authLink).not.toBeNull();
  expect(authLink).toMatch(/^http/);

  // Remove domain and port
  authLink = authLink.replace(/&amp;/g, '&');
  console.log(authLink);
  //authLink = authLink.replace(/^https?:\/\/[^/]+/, '');

  // Go to the link to log in
  await page.goto(authLink);
  await expect(page.getByRole('heading', { name: 'Subscriptions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Modify subscriptions' })).toBeVisible();

  // Teardown email client
  await emailTeardown();
});
