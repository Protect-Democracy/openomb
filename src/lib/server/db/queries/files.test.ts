/**
 * Tests for files.ts
 */

// Dependencies
import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { createIsolatedDb } from '$tests/helpers/db';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { apportionmentTypeStandard } from '$config/files';
import { fileDetails, fileTafsFootnotesByIds } from './files';

/**
 * Insert a file with several tafs rows, one per suffix, all sharing the same
 * iteration/fiscal year.
 */
async function insertFileWithTafs(
  fileId: string,
  suffixes: string[],
  { iteration, fiscalYear }: { iteration: number; fiscalYear: number }
) {
  await db.insert(files).values({
    fileId,
    fileType: apportionmentTypeStandard,
    folder: 'Iterations Agency',
    folderId: 'iterations-agency',
    fiscalYear,
    sourceUrl: `http://example.com/${fileId}.json`
  });

  for (const suffix of suffixes) {
    await db.insert(tafs).values({
      fileId,
      tafsId: `900-000${suffix}`,
      tafsTableId: `${fileId}--900-000${suffix}`,
      iteration,
      fiscalYear,
      cgacAgency: '900',
      cgacAcct: `000${suffix}`,
      accountId: `900-000${suffix}`,
      budgetAgencyTitle: 'Iterations Agency',
      budgetAgencyTitleId: 'iterations-agency',
      budgetBureauTitle: 'Iterations Bureau',
      budgetBureauTitleId: 'iterations-bureau'
    });
  }
}

describe('fileDetails() iterations batching', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    // Prior iteration (iteration 1) and current iteration (iteration 2) of
    // the same three tafsIds, same fiscal year -- gives each tafsId two
    // iterations to aggregate across two files.
    await insertFileWithTafs('iterations-prior-file', ['a', 'b', 'c'], {
      iteration: 1,
      fiscalYear: 2025
    });
    await insertFileWithTafs('iterations-current-file', ['a', 'b', 'c'], {
      iteration: 2,
      fiscalYear: 2025
    });
  });

  afterEach(async () => {
    // Restore unconditionally (not just on the happy path) so a spy from a
    // failing test never leaks captured calls into a later test.
    vi.restoreAllMocks();
    await dbSetup.teardown();
  });

  test('fetches iteration history for all tafs rows with a single query, not one per tafs row', async () => {
    const selectSpy = vi.spyOn(db, 'select');

    const result = await fileDetails('iterations-current-file');

    expect(result?.tafs).toHaveLength(3);

    // Previously this looped one db.select() query per tafs row on the file
    // (an N+1 pattern) -- see PD-APPORTIONMENTS-BROWSER-62/-4C.
    expect(selectSpy).toHaveBeenCalledTimes(1);
  });

  test('does not scale with the number of tafs rows on the file', async () => {
    await insertFileWithTafs('iterations-wide-file', ['a', 'b', 'c', 'd', 'e', 'f'], {
      iteration: 1,
      fiscalYear: 2025
    });

    const selectSpy = vi.spyOn(db, 'select');

    const result = await fileDetails('iterations-wide-file');

    expect(result?.tafs).toHaveLength(6);
    expect(selectSpy).toHaveBeenCalledTimes(1);
  });

  test('groups iterations by the correct tafsId, ordered ascending, without cross-contamination', async () => {
    const result = await fileDetails('iterations-current-file');

    const tafA = result?.tafs?.find((t) => t.tafsId === '900-000a');
    expect(tafA?.iterations?.map((iter) => iter.iteration)).toEqual([1, 2]);
    expect(tafA?.iterations?.every((iter) => iter.tafsId === '900-000a')).toBe(true);

    const tafB = result?.tafs?.find((t) => t.tafsId === '900-000b');
    expect(tafB?.iterations?.map((iter) => iter.iteration)).toEqual([1, 2]);
    expect(tafB?.iterations?.every((iter) => iter.tafsId === '900-000b')).toBe(true);
  });

  test('returns an empty iterations array, with zero extra queries, for a file with no tafs rows', async () => {
    await db.insert(files).values({
      fileId: 'iterations-empty-file',
      fileType: apportionmentTypeStandard,
      folder: 'Iterations Agency',
      folderId: 'iterations-agency',
      fiscalYear: 2025,
      sourceUrl: 'http://example.com/iterations-empty-file.json'
    });

    const selectSpy = vi.spyOn(db, 'select');

    const result = await fileDetails('iterations-empty-file');

    expect(result?.tafs).toEqual([]);
    expect(selectSpy).not.toHaveBeenCalled();
  });

  test("iterations are scoped to the tafs row's own fiscal year", async () => {
    // Same tafsId as the prior/current files above, but a different fiscal
    // year -- must not be pulled into iteration 2025's iteration history.
    await insertFileWithTafs('iterations-other-fy-file', ['a'], {
      iteration: 1,
      fiscalYear: 2024
    });

    const result = await fileDetails('iterations-current-file');

    const tafA = result?.tafs?.find((t) => t.tafsId === '900-000a');
    expect(tafA?.iterations?.map((iter) => iter.fileId)).not.toContain('iterations-other-fy-file');
  });
});

describe('fileTafsFootnotesByIds()', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    await insertFileWithTafs('batch-file-1', ['a'], { iteration: 1, fiscalYear: 2025 });
    await insertFileWithTafs('batch-file-2', ['b'], { iteration: 1, fiscalYear: 2025 });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await dbSetup.teardown();
  });

  test('fetches details for multiple files with a single batched query, not one per file', async () => {
    const findFirstSpy = vi.spyOn(db.query.files, 'findFirst');
    const findManySpy = vi.spyOn(db.query.files, 'findMany');

    const result = await fileTafsFootnotesByIds(['batch-file-1', 'batch-file-2']);

    expect(result.size).toBe(2);
    expect(findManySpy).toHaveBeenCalledTimes(1);
    expect(findFirstSpy).not.toHaveBeenCalled();
  });

  test('returns a Map keyed by fileId containing only the requested (found) files', async () => {
    const result = await fileTafsFootnotesByIds(['batch-file-1', 'does-not-exist']);

    expect(Array.from(result.keys())).toEqual(['batch-file-1']);
    expect(result.get('batch-file-1')?.tafs).toHaveLength(1);
  });

  test('dedupes repeated ids without extra queries', async () => {
    const findManySpy = vi.spyOn(db.query.files, 'findMany');

    const result = await fileTafsFootnotesByIds(['batch-file-1', 'batch-file-1', 'batch-file-2']);

    expect(findManySpy).toHaveBeenCalledTimes(1);
    expect(result.size).toBe(2);
  });

  test('returns an empty Map and issues no query for an empty id list', async () => {
    const findManySpy = vi.spyOn(db.query.files, 'findMany');

    const result = await fileTafsFootnotesByIds([]);

    expect(result.size).toBe(0);
    expect(findManySpy).not.toHaveBeenCalled();
  });

  test('omits the per-tafs iterations field present on fileDetails()', async () => {
    const result = await fileTafsFootnotesByIds(['batch-file-1']);

    expect(result.get('batch-file-1')?.tafs?.[0]).not.toHaveProperty('iterations');
  });
});
