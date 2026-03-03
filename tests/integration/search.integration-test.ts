import { expect, test } from '@playwright/test';

test('search page has basic expected items', async ({ page }) => {
  await page.goto('/search');

  // Make sure title is Search Appotionments
  await expect(
    page.locator('main').getByRole('heading', { name: 'Search Apportionments' })
  ).toBeVisible();

  // Should be an input with id=term
  await expect(page.locator('input#term')).toBeVisible();

  // Should be a button with text Search
  await expect(page.locator('button').getByText('Search')).toBeVisible();
});

test('linked to search pages have some items', async ({ page }) => {
  // Since we are going to a number of pages here
  test.slow();

  // Note that these tests are a little brittle, as they depend on the test data
  // set which is not guaranteed to have this specific data in it.  But these are
  // general enough where they *should* have results.
  const testPages = [
    '/search?term=test',
    '/search?year=2022&year=2023',
    '/search?agencyBureau=department-of-state',
    '/search?agencyBureau=department-of-education%2Coffice-of-federal-student-aid',
    '/search?tafs=2024',
    '/search?account=general',
    '/search?approver=deputy-associate-director-for-health-programs',
    '/search?approvedStart=2025-03-01&approvedEnd=2025-06-25',
    '/search?lineNum=1000',
    '/search?footnoteNum=A',
    '/search?apportionmentType=letter'
  ];
  for (const url of testPages) {
    await page.goto(url);

    // Make sure title is there
    await expect(
      page.locator('main').getByRole('heading', { name: 'Search Apportionments' })
    ).toBeVisible();

    // Should have text similar to Results 1 - 50 of 130 files
    const resultsText = await page.locator('.result-count p').first().innerText();
    const match = resultsText.match(/Results [\d,]+ - [\d,]+ of ([\d,]+) files/);
    const totalResults = match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
    expect(totalResults).toBeGreaterThan(0);
  }
});
