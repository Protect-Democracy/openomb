import { expect, test } from '@playwright/test';
import { siteName } from '$config';

test('index page has expected items', async ({ page }) => {
  // Make sure the banner has the site name
  await page.goto('/');
  await expect(page.getByRole('banner').getByText(siteName)).toBeVisible();

  // Make sure stats exists
  await expect(page.locator('.stats').getByText('New apportionments approved')).toBeVisible();

  // Make sure list of apportionments is visible
  await expect(page.locator('.recently-approved-files ul li')).toHaveCount(10);
});

test('about page has expected h1', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('main').getByRole('heading', { name: 'About' })).toBeVisible();
});
