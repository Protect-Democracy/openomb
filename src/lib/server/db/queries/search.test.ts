/**
 * Tests for search.ts
 */

// Dependencies
import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { createIsolatedDb } from '$tests/helpers/db';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { apportionmentTypeStandard } from '$config/files';
import { fileSearchPaged } from './search';
import type { SearchPaginationParams } from './search';

describe('fileSearchPaged()', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    // Three files in the same folder, with distinct approval timestamps so the
    // default sort order (approval DESC) is deterministic: c, b, a.
    const fileSuffixes = [
      { suffix: 'a', approvalTimestamp: new Date('2024-01-01') },
      { suffix: 'b', approvalTimestamp: new Date('2024-02-01') },
      { suffix: 'c', approvalTimestamp: new Date('2024-03-01') }
    ];

    for (const { suffix, approvalTimestamp } of fileSuffixes) {
      await db.insert(files).values({
        fileId: `n-plus-one-file-${suffix}`,
        fileType: apportionmentTypeStandard,
        folder: 'N Plus One Agency',
        folderId: 'n-plus-one-agency',
        approvalTimestamp,
        sourceUrl: `http://example.com/n-plus-one-file-${suffix}.json`
      });
      await db.insert(tafs).values({
        fileId: `n-plus-one-file-${suffix}`,
        tafsId: `900-000${suffix}`,
        iteration: 1,
        fiscalYear: 2025,
        cgacAgency: '900',
        cgacAcct: `000${suffix}`,
        accountId: `900-000${suffix}`,
        budgetAgencyTitle: 'N Plus One Agency',
        budgetAgencyTitleId: 'n-plus-one-agency',
        budgetBureauTitle: 'N Plus One Bureau',
        budgetBureauTitleId: 'n-plus-one-bureau'
      });
    }
  });

  afterEach(async () => {
    await dbSetup.teardown();
  });

  test('fetches details for multiple files with a single batched query, not one per file', async () => {
    const findFirstSpy = vi.spyOn(db.query.files, 'findFirst');
    const findManySpy = vi.spyOn(db.query.files, 'findMany');

    const results = await fileSearchPaged({
      folder: 'n-plus-one-agency',
      offset: 0,
      limit: 20
    } as SearchPaginationParams);

    expect(results).toHaveLength(3);

    // Previously this looped `db.query.files.findFirst()` once per row (an N+1
    // pattern) instead of a single batched `findMany()` — see
    // PD-APPORTIONMENTS-BROWSER-E6/-FN, PD-APPORTIONMENTS-NODE-1R.
    expect(findManySpy).toHaveBeenCalledTimes(1);
    expect(findFirstSpy).not.toHaveBeenCalled();

    findFirstSpy.mockRestore();
    findManySpy.mockRestore();
  });

  test('preserves the order established by the id-selection query', async () => {
    const results = await fileSearchPaged({
      folder: 'n-plus-one-agency',
      offset: 0,
      limit: 20
    } as SearchPaginationParams);

    // Default sort is by approval timestamp descending, so most-recently
    // approved first. `findMany()` (unlike the old per-id `findFirst()` loop)
    // does not preserve this order on its own, so it must be re-applied.
    expect(results.map((result) => result?.fileId)).toEqual([
      'n-plus-one-file-c',
      'n-plus-one-file-b',
      'n-plus-one-file-a'
    ]);
  });
});
