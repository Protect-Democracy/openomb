/**
 * Tests for the 0010 data migration: clearing agency/bureau info on PDF files stuck in Unknown
 * Folder.
 */

// Dependencies
import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { createIsolatedDb } from '$tests/helpers/db';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { fileDetails } from '$db/queries/files';
import { apportionmentTypeStandard, apportionmentTypeSpendPlan } from '$config/files';

const _dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = joinPath(_dirname, '0010_clear_unknown_folder_spend_plan_agency.sql');

describe('0010 migration: clear Unknown Folder PDF agency/bureau info', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    // A spend-plan PDF that fell back to Unknown Folder but still has agency/bureau set — this
    // is the row the migration should clean up.
    await db.insert(files).values({
      fileId: 'unknown-folder-spend-plan-pdf',
      fileType: apportionmentTypeSpendPlan,
      folder: 'Unknown Folder',
      folderId: 'unknown-folder',
      budgetAgencyTitle: 'Some Agency',
      budgetAgencyTitleId: 'some-agency',
      budgetBureauTitle: 'Some Bureau',
      budgetBureauTitleId: 'some-bureau',
      sourceUrl: 'http://example.com/unknown-folder-spend-plan.pdf',
      pdfUrl: 'http://example.com/unknown-folder-spend-plan.pdf'
    });

    // A spend-plan PDF with a real folder — should be left untouched.
    await db.insert(files).values({
      fileId: 'real-folder-spend-plan-pdf',
      fileType: apportionmentTypeSpendPlan,
      folder: 'Real Agency',
      folderId: 'real-agency',
      budgetAgencyTitle: 'Real Agency',
      budgetAgencyTitleId: 'real-agency',
      sourceUrl: 'http://example.com/real-folder-spend-plan.pdf',
      pdfUrl: 'http://example.com/real-folder-spend-plan.pdf'
    });

    // A spend-plan JSON file (no pdfUrl) in Unknown Folder with agency set — should be left
    // untouched since the migration only targets PDF files.
    await db.insert(files).values({
      fileId: 'unknown-folder-spend-plan-json',
      fileType: apportionmentTypeSpendPlan,
      folder: 'Unknown Folder',
      folderId: 'unknown-folder',
      budgetAgencyTitle: 'Some Agency',
      budgetAgencyTitleId: 'some-agency',
      sourceUrl: 'http://example.com/unknown-folder-spend-plan.json'
    });

    // A regular apportionment PDF in Unknown Folder (unusual, but should still be a no-op since
    // it never had a budget_agency_title set).
    await db.insert(files).values({
      fileId: 'unknown-folder-standard-pdf',
      fileType: apportionmentTypeStandard,
      folder: 'Unknown Folder',
      folderId: 'unknown-folder',
      sourceUrl: 'http://example.com/unknown-folder-standard.pdf',
      pdfUrl: 'http://example.com/unknown-folder-standard.pdf'
    });
  });

  afterEach(async () => {
    await dbSetup.teardown();
  });

  test('clears agency/bureau info only for PDF files in Unknown Folder', async () => {
    const migrationSql = await fs.readFile(migrationPath, 'utf-8');
    await db.execute(sql.raw(migrationSql));

    const cleared = await fileDetails('unknown-folder-spend-plan-pdf');
    expect(cleared).toMatchObject({
      budgetAgencyTitle: null,
      budgetAgencyTitleId: null,
      budgetBureauTitle: null,
      budgetBureauTitleId: null,
      folder: 'Unknown Folder'
    });

    const untouchedRealFolder = await fileDetails('real-folder-spend-plan-pdf');
    expect(untouchedRealFolder).toMatchObject({
      budgetAgencyTitle: 'Real Agency',
      budgetAgencyTitleId: 'real-agency'
    });

    const untouchedJson = await fileDetails('unknown-folder-spend-plan-json');
    expect(untouchedJson).toMatchObject({
      budgetAgencyTitle: 'Some Agency',
      budgetAgencyTitleId: 'some-agency'
    });

    const untouchedStandard = await fileDetails('unknown-folder-standard-pdf');
    expect(untouchedStandard).toMatchObject({
      budgetAgencyTitle: null,
      budgetAgencyTitleId: null
    });
  });
});
