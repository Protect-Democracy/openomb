import { expect, test } from '@playwright/test';
import { db } from '$db/connection';
import { apportionmentTypeStandard, apportionmentTypeSpendPlan } from '$config/files';

test('file page - standard', async ({ page }) => {
  // Find a file that is a standard type and not a letter/pdf
  const file = await db.query.files.findFirst({
    where: (files, { eq, and, isNull }) =>
      and(eq(files.fileType, apportionmentTypeStandard), isNull(files.pdfUrl))
  });
  expect(file).toBeDefined();

  // Go to file
  await page.goto(`/file/${file?.fileId}`);

  // Check heading
  await expect(page.locator('h1')).toBeVisible();
});

test('file page - letter', async ({ page }) => {
  // Find a file that is a letter type
  const file = await db.query.files.findFirst({
    where: (files, { eq, and, isNotNull }) =>
      and(eq(files.fileType, apportionmentTypeStandard), isNotNull(files.pdfUrl))
  });
  expect(file).toBeDefined();

  // Go to file
  await page.goto(`/file/${file?.fileId}`);

  // Check heading
  await expect(page.locator('h1')).toBeVisible();
});

test('file page - spend-plan', async ({ page }) => {
  // Find a file that is a letter type
  const file = await db.query.files.findFirst({
    where: (files, { eq }) => eq(files.fileType, apportionmentTypeSpendPlan)
  });
  expect(file).toBeDefined();

  // Go to file
  await page.goto(`/file/${file?.fileId}`);

  // Check heading
  await expect(page.locator('h1')).toBeVisible();
});
