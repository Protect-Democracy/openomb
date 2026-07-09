/**
 * Tests for agencies.ts
 */

// Dependencies
import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { createIsolatedDb } from '$tests/helpers/db';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { apportionmentTypeStandard, apportionmentTypeSpendPlan } from '$config/files';
import { agencies, bureaus } from './agencies';

describe('agencies() / bureaus() fileTypes filtering', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    // A real agency/bureau backed by an actual apportionment schedule (tafs row).
    await db.insert(files).values({
      fileId: 'real-standard-file',
      fileType: apportionmentTypeStandard,
      folder: 'Real Agency',
      folderId: 'real-agency',
      sourceUrl: 'http://example.com/real-standard-file.json'
    });
    await db.insert(tafs).values({
      fileId: 'real-standard-file',
      tafsId: '001-0001',
      iteration: 1,
      fiscalYear: 2025,
      cgacAgency: '001',
      cgacAcct: '0001',
      accountId: '001-0001',
      budgetAgencyTitle: 'Real Agency',
      budgetAgencyTitleId: 'real-agency',
      budgetBureauTitle: 'Real Bureau',
      budgetBureauTitleId: 'real-bureau'
    });

    // An agency/bureau that only ever appears via a spend plan (no tafs row at all) — this is
    // the exact shape a spend plan that fell back to Unknown Folder ends up with.
    await db.insert(files).values({
      fileId: 'spend-plan-only-file',
      fileType: apportionmentTypeSpendPlan,
      folder: 'Unknown Folder',
      folderId: 'unknown-folder',
      budgetAgencyTitle: 'Spend Plan Only Agency',
      budgetAgencyTitleId: 'spend-plan-only-agency',
      budgetBureauTitle: 'Spend Plan Only Bureau',
      budgetBureauTitleId: 'spend-plan-only-bureau',
      sourceUrl: 'http://example.com/spend-plan-only-file.pdf',
      pdfUrl: 'http://example.com/spend-plan-only-file.pdf'
    });
  });

  afterEach(async () => {
    await dbSetup.teardown();
  });

  test('agencies() includes both by default', async () => {
    const results = await agencies();
    const titleIds = results.map((a) => a.budgetAgencyTitleId);
    expect(titleIds).toContain('real-agency');
    expect(titleIds).toContain('spend-plan-only-agency');
  });

  test('agencies({ fileTypes: ["standard"] }) excludes spend-plan-only agencies', async () => {
    const results = await agencies('names', { fileTypes: [apportionmentTypeStandard] });
    const titleIds = results.map((a) => a.budgetAgencyTitleId);
    expect(titleIds).toContain('real-agency');
    expect(titleIds).not.toContain('spend-plan-only-agency');
  });

  test('agencies({ fileTypes: ["spend-plan"] }) returns only spend-plan-only agencies', async () => {
    const results = await agencies('names', { fileTypes: [apportionmentTypeSpendPlan] });
    const titleIds = results.map((a) => a.budgetAgencyTitleId);
    expect(titleIds).not.toContain('real-agency');
    expect(titleIds).toContain('spend-plan-only-agency');
  });

  test('bureaus() includes both by default', async () => {
    const results = await bureaus();
    const titleIds = results.map((b) => b.budgetBureauTitleId);
    expect(titleIds).toContain('real-bureau');
    expect(titleIds).toContain('spend-plan-only-bureau');
  });

  test('bureaus({ fileTypes: ["standard"] }) excludes spend-plan-only bureaus', async () => {
    const results = await bureaus({ fileTypes: [apportionmentTypeStandard] });
    const titleIds = results.map((b) => b.budgetBureauTitleId);
    expect(titleIds).toContain('real-bureau');
    expect(titleIds).not.toContain('spend-plan-only-bureau');
  });

  test('bureaus({ fileTypes: ["spend-plan"] }) returns only spend-plan-only bureaus', async () => {
    const results = await bureaus({ fileTypes: [apportionmentTypeSpendPlan] });
    const titleIds = results.map((b) => b.budgetBureauTitleId);
    expect(titleIds).not.toContain('real-bureau');
    expect(titleIds).toContain('spend-plan-only-bureau');
  });
});
