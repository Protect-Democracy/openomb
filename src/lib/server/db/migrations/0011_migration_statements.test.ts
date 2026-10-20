/**
 * Tests for the 0011 migration: adding and backfilling tafs.tafs_formatted_id.
 *
 * The backfill is a SQL copy of formatTafsFormattedId(), so the main point of these tests is to
 * confirm the two produce identical output across the different TAFS shapes.
 */

// Dependencies
import { expect, test, describe, beforeEach, afterEach } from 'vitest';
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { eq, sql } from 'drizzle-orm';
import { createIsolatedDb } from '$tests/helpers/db';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { formatTafsFormattedId } from '$lib/formatters';
import { apportionmentTypeStandard } from '$config/files';
import type { tafsInsert } from '$schema/tafs';

const _dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = joinPath(_dirname, '0011_migration_statements.sql');

const fileId = 'tafs-formatted-id-file';

// Covers each branch of the period-of-availability formatting, plus the optional
// allocation agency/subaccount parts of the account.
const tafsShapes: Array<
  Pick<tafsInsert, 'tafsId' | 'cgacAgency' | 'cgacAcct'> & Partial<tafsInsert>
> = [
  // Multi-year: "070-0613 2025/2029"
  {
    tafsId: '070-0613-2025-2029',
    cgacAgency: '070',
    cgacAcct: '0613',
    beginPoa: 2025,
    endPoa: 2029
  },
  // Single-year (begin = end): "069-0130 /2029"
  {
    tafsId: '069-0130-2029-2029',
    cgacAgency: '069',
    cgacAcct: '0130',
    beginPoa: 2029,
    endPoa: 2029
  },
  // Begin only: "012-3510 /2023"
  { tafsId: '012-3510-2023', cgacAgency: '012', cgacAcct: '3510', beginPoa: 2023, endPoa: null },
  // No years: "080-1200 /X"
  { tafsId: '080-1200', cgacAgency: '080', cgacAcct: '1200', beginPoa: null, endPoa: null },
  // Allocation agency and subaccount: "060-8051-002-060 /X"
  {
    tafsId: '060-8051-002-060',
    cgacAgency: '060',
    cgacAcct: '8051',
    allocationAgencyCode: '002',
    allocationSubacct: '060'
  },
  // Empty-string allocation parts are dropped, like the JS filter(Boolean): "075-0357 /2024"
  {
    tafsId: '075-0357-2024-2024',
    cgacAgency: '075',
    cgacAcct: '0357',
    allocationAgencyCode: '',
    allocationSubacct: '',
    beginPoa: 2024,
    endPoa: 2024
  }
];

describe('0011 migration: backfill tafs_formatted_id', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    await db.insert(files).values({
      fileId,
      fileType: apportionmentTypeStandard,
      folder: 'Some Agency',
      folderId: 'some-agency',
      sourceUrl: 'http://example.com/tafs-formatted-id.json'
    });

    // Rows as they would exist before this migration: no tafs_formatted_id.
    for (const shape of tafsShapes) {
      await db.insert(tafs).values({
        fileId,
        iteration: 1,
        fiscalYear: 2025,
        accountId: shape.tafsId,
        ...shape
      });
    }

    // A row that already has a value should be left alone.
    await db.insert(tafs).values({
      fileId,
      tafsId: '999-0001',
      iteration: 1,
      fiscalYear: 2025,
      cgacAgency: '999',
      cgacAcct: '0001',
      accountId: '999-0001',
      tafsFormattedId: 'already set'
    });
  });

  afterEach(async () => {
    await dbSetup.teardown();
  });

  test('backfills values identical to formatTafsFormattedId()', async () => {
    const migrationSql = await fs.readFile(migrationPath, 'utf-8');
    await db.execute(sql.raw(migrationSql));

    for (const shape of tafsShapes) {
      const [row] = await db.select().from(tafs).where(eq(tafs.tafsId, shape.tafsId));
      expect(row.tafsFormattedId).toBe(formatTafsFormattedId(row));
    }

    // Spot-check a couple of literal values so a matching bug in both
    // implementations would still be caught.
    const [multiYear] = await db.select().from(tafs).where(eq(tafs.tafsId, '070-0613-2025-2029'));
    expect(multiYear.tafsFormattedId).toBe('070-0613 2025/2029');

    const [singleYear] = await db.select().from(tafs).where(eq(tafs.tafsId, '069-0130-2029-2029'));
    expect(singleYear.tafsFormattedId).toBe('069-0130 /2029');
  });

  test('does not overwrite existing values', async () => {
    const migrationSql = await fs.readFile(migrationPath, 'utf-8');
    await db.execute(sql.raw(migrationSql));

    const [row] = await db.select().from(tafs).where(eq(tafs.tafsId, '999-0001'));
    expect(row.tafsFormattedId).toBe('already set');
  });
});
