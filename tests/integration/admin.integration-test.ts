import { expect, test } from '@playwright/test';

test('unauthenticated visitor gets a 404', async ({ page }) => {
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(404);
});
