import { expect, test } from '@playwright/test';

test('navigate groups', async ({ page }) => {
  // NOTE: This test is a little brittle as the test-data generation
  // script doesn't guarantee that this specific group will be generated,
  // but it should be ok.

  // Folder
  // =====================
  await page.goto('/folder/department-of-homeland-security');
  await expect(
    page
      .locator('main')
      .getByRole('heading', { name: 'Folder: Department of Homeland Security', exact: false })
  ).toBeVisible();

  // Ensure that the list after the "Agencies" heading has items
  const agencyHeading = await page.locator('main').getByRole('heading', { name: 'Agencies' });
  const agencyList = agencyHeading.locator('..').locator('ul');
  await expect(await agencyList.locator('li').count()).toBeGreaterThan(0);

  // Find the first agency link
  const firstAgencyLinkHref = await agencyList.locator('li a').first().getAttribute('href');
  expect(firstAgencyLinkHref).not.toBeNull();

  // Make sure there is at least .file-listing-small item
  await expect(await page.locator('.file-listing-small').count()).toBeGreaterThan(0);

  // Agency
  // =====================
  // Go to agency and check heading
  await page.goto(firstAgencyLinkHref || '');
  await expect(
    page.locator('main').getByRole('heading', { name: 'Agency', exact: false })
  ).toBeVisible();

  // Ensure that the list after the "Bureaus" heading has items
  const bureauHeading = await page.locator('main').getByRole('heading', { name: 'Bureaus' });
  const bureauList = bureauHeading.locator('..').locator('ul');
  await expect(await bureauList.locator('li').count()).toBeGreaterThan(0);

  // Make sure there is at least .file-listing-small item
  await expect(await page.locator('.file-listing-small').count()).toBeGreaterThan(0);

  // Get the first link to bureau
  const firstBureauLinkHref = await bureauList.locator('li a').first().getAttribute('href');
  expect(firstBureauLinkHref).not.toBeNull();

  // Bureau
  // =====================
  // Go to bureau and check heading
  await page.goto(firstBureauLinkHref || '');
  await expect(
    page.locator('main').getByRole('heading', { name: 'Bureau', exact: false })
  ).toBeVisible();

  // Ensure that the list after the "Accounts" heading has items
  const accountsHeading = await page.locator('main').getByRole('heading', { name: 'Accounts' });
  const accountsList = accountsHeading.locator('..').locator('ul');
  await expect(await accountsList.locator('li').count()).toBeGreaterThan(0);

  // Make sure there is at least .file-listing-small item
  await expect(await page.locator('.file-listing-small').count()).toBeGreaterThan(0);

  // Get first link to account
  const firstAccountLinkHref = await accountsList.locator('li a').first().getAttribute('href');
  const firstAccountName = await accountsList.locator('li a').first().innerText();
  expect(firstAccountLinkHref).not.toBeNull();

  // Account
  // =====================
  // Go to account and check heading
  await page.goto(firstAccountLinkHref || '');
  await expect(
    page.locator('main').getByRole('heading', { name: firstAccountName, exact: false })
  ).toBeVisible();

  // Check links to files
  const fileLinks = page.locator('dl.iterations dd a');
  await expect(await fileLinks.count()).toBeGreaterThan(0);

  // Go to file just as a final check, but file should be tested more completely somewhere else
  const firstFileLinkHref = await fileLinks.first().getAttribute('href');
  expect(firstFileLinkHref).not.toBeNull();
  await page.goto(firstFileLinkHref || '');

  // Expect heading to not be an error
  await expect(page.locator('h1')).toBeVisible();
});
