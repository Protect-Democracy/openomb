import { expect, test } from '@playwright/test';

test('index page has expected items', async ({ page }) => {
  // Make sure the banner has the site name
  await page.goto('/');
  await expect(page.getByRole('banner').getByText('OpenOMB')).toBeVisible();

  // Make sure stats exists
  await expect(page.locator('.stats').getByText('New apportionments approved')).toBeVisible();

  // Make sure list of apportionments is visible
  await expect(page.locator('.recently-approved-files ul li')).toHaveCount(10);
});

test('static pages', async ({ page }) => {
  const pages = [
    { path: '/about', heading: 'About' },
    { path: '/explore', heading: 'Explore' },
    { path: '/folders', heading: 'Agencies' },
    { path: '/faq', heading: 'Frequently' },
    { path: '/developers', heading: 'Developers' },
    { path: '/terms', heading: 'OpenOMB Terms and Conditions' },
    { path: '/privacy-policy', heading: 'OpenOMB Privacy Policy' }
  ];

  for (const { path, heading } of pages) {
    await page.goto(path);
    await expect(
      page.locator('main').getByRole('heading', { name: heading, exact: false })
    ).toBeVisible();
  }
});
