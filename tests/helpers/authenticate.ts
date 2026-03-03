import { emailClient } from '$tests/helpers/email';
import type { Page, BrowserContext } from '@playwright/test';

/**
 * Authenticates a user by email.  To be used in integration tests.
 *
 * @param email The email address of the user to authenticate.
 * @param page The Playwright page object.
 * @param context The Playwright browser context.
 * @param baseURL The base URL of the application.

 * @returns
 */
export async function integrationAuthenticate(
  email: string,
  page: Page,
  context: BrowserContext,
  baseURL: string | undefined
) {
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
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send link' }).click();

  // Wait for the confirmation email
  const emailData = await newEmailWatch;

  // Get the link from the email
  const emailHtml = await mailClient.renderMessageHTML(emailData.Data.ID);
  const linkMatch = emailHtml.match(/"(https?:\/\/[^\s]+auth\/callback[^\s]+)"/im);
  if (!linkMatch) {
    throw new Error('No link found in email');
  }
  let authLink = linkMatch[1];

  // Ensure that any HTML entities in the link are decoded (e.g. &amp; to &)
  authLink = authLink.replace(/&amp;/g, '&');

  // Go to the link to log in
  await page.goto(authLink);

  return {
    mailClient,
    teardown: async () => {
      // Delete emails
      await emailTeardown();

      // Delete cookies
      const cookies = await context.cookies();
      await context.clearCookies();
    }
  };
}
