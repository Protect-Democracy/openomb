/**
 * Tests for agencies.ts
 */

// Dependencies
import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import pg from 'pg';
import { createIsolatedDb } from '$tests/helpers/db';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { apportionmentTypeStandard, apportionmentTypeSpendPlan } from '$config/files';
import { agencies, bureaus, agencyDetails, bureauDetails, mAgencyDetails } from './agencies';

/**
 * Spy on the underlying pg Pool so we can inspect the raw SQL text Drizzle
 * sends to Postgres, since these functions execute queries directly rather
 * than returning a builder we could call `.toSQL()` on. Mirrors the helper in
 * search.test.ts.
 */
function spyOnExecutedSql() {
  const querySpy = vi.spyOn(pg.Pool.prototype, 'query');
  return {
    querySpy,
    executedSql: (): string[] =>
      querySpy.mock.calls
        .map(([queryArg]: [unknown]) =>
          typeof queryArg === 'string' ? queryArg : ((queryArg as { text?: string })?.text ?? '')
        )
        .filter(Boolean)
  };
}

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

describe('agencyDetails() / bureauDetails() filter the union branches directly', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    // Agency/bureau under test, backed by a real tafs row.
    await db.insert(files).values({
      fileId: 'agency-details-file',
      fileType: apportionmentTypeStandard,
      folder: 'Agency Details Agency',
      folderId: 'agency-details-agency',
      sourceUrl: 'http://example.com/agency-details-file.json'
    });
    await db.insert(tafs).values({
      fileId: 'agency-details-file',
      tafsId: '900-0001',
      iteration: 1,
      fiscalYear: 2025,
      cgacAgency: '900',
      cgacAcct: '0001',
      accountId: '900-0001',
      budgetAgencyTitle: 'Agency Details Agency',
      budgetAgencyTitleId: 'agency-details-agency',
      budgetBureauTitle: 'Agency Details Bureau',
      budgetBureauTitleId: 'agency-details-bureau'
    });

    // A different agency/bureau, spend-plan-only (files-branch-only), so a
    // test that the filter narrows results has something to exclude.
    await db.insert(files).values({
      fileId: 'other-agency-file',
      fileType: apportionmentTypeSpendPlan,
      folder: 'Other Agency',
      folderId: 'other-agency',
      budgetAgencyTitle: 'Other Agency',
      budgetAgencyTitleId: 'other-agency',
      budgetBureauTitle: 'Other Bureau',
      budgetBureauTitleId: 'other-bureau',
      sourceUrl: 'http://example.com/other-agency-file.pdf',
      pdfUrl: 'http://example.com/other-agency-file.pdf'
    });
  });

  afterEach(async () => {
    // Restore unconditionally (not just on the happy path) so a spy from a
    // failing test never leaks captured SQL into a later test.
    vi.restoreAllMocks();
    await dbSetup.teardown();
  });

  test('agencyDetails() filters both union branches by budgetAgencyTitleId, not just the outer query', async () => {
    const { executedSql } = spyOnExecutedSql();

    const result = await agencyDetails('agency-details-agency');
    expect(result?.budgetAgencyTitleId).toBe('agency-details-agency');

    // Previously this filter was only applied outside the union (on the
    // "agencyFiles" alias), so the union itself scanned every tafs/files row
    // in the dataset — see PD-APPORTIONMENTS-BROWSER-FW/-FX/-FV/-GP/-CW.
    const unionStatements = executedSql().filter((sql) => sql.includes('union'));
    expect(unionStatements.length).toBeGreaterThan(0);
    for (const sql of unionStatements) {
      expect(sql.match(/"budget_agency_title_id" = \$\d/g)).toHaveLength(2);
    }
  });

  test('bureauDetails() filters both union branches by agency and bureau ID, not just the outer query', async () => {
    const { executedSql } = spyOnExecutedSql();

    const result = await bureauDetails('agency-details-agency', 'agency-details-bureau');
    expect(result?.budgetBureauTitleId).toBe('agency-details-bureau');

    // bureauDetails() also calls agencyDetails() internally (for the nested
    // `agency` field), which produces its own union statement scoped only to
    // the agency ID — filter those out so we only assert on the bureauFiles
    // union statements, which must additionally filter by bureau ID.
    const unionStatements = executedSql().filter(
      (sql) => sql.includes('union') && sql.includes('budget_bureau_title')
    );
    expect(unionStatements.length).toBeGreaterThan(0);
    for (const sql of unionStatements) {
      expect(sql.match(/"budget_agency_title_id" = \$\d/g)).toHaveLength(2);
      expect(sql.match(/"budget_bureau_title_id" = \$\d/g)).toHaveLength(2);
    }
  });

  test('mAgencyDetails() caches repeated calls with the same agency ID', async () => {
    const { querySpy } = spyOnExecutedSql();

    await mAgencyDetails('agency-details-agency');
    const queryCountAfterFirstCall = querySpy.mock.calls.length;
    expect(queryCountAfterFirstCall).toBeGreaterThan(0);

    await mAgencyDetails('agency-details-agency');
    expect(querySpy.mock.calls.length).toBe(queryCountAfterFirstCall);
  });
});
