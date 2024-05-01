import { expect, test } from '@playwright/test';
import { siteName } from '$config';

test('index page has expected banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner').getByRole('heading', { name: siteName })).toBeVisible();
});

test('about page has expected h1', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('main').getByRole('heading', { name: 'About' })).toBeVisible();
});
