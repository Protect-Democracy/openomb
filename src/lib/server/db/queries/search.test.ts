/**
 * Tests for search.ts
 */

// Dependencies
import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import pg from 'pg';
import { createIsolatedDb } from '$tests/helpers/db';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { lines } from '$schema/lines';
import { footnotes } from '$schema/footnotes';
import { apportionmentTypeStandard } from '$config/files';
import {
  fileSearchPaged,
  fileSearchFullCountQuery,
  tafsSearchFullCountQuery,
  tafsSearchFullFileCountQuery,
  accountSearchPaged,
  accountSearchFullCountQuery
} from './search';
import type { SearchPaginationParams } from './search';

/**
 * Spy on the underlying pg Pool so we can inspect the raw SQL text Drizzle
 * sends to Postgres, since the search functions execute queries directly
 * rather than returning a builder we could call `.toSQL()` on.
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

describe('search queries avoid unnecessary lines/footnotes joins', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  const tafsTableId = 'lines-join-file-a--900-0001--1--2025';

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    // One file/tafs pair with two line rows (so a query that directly joins
    // `lines` instead of filtering via subquery would fan out to two rows per
    // tafs/file) and footnotes on those lines (so a direct join to `footnotes`
    // would fan out further still).
    await db.insert(files).values({
      fileId: 'lines-join-file-a',
      fileType: apportionmentTypeStandard,
      folder: 'Lines Join Agency',
      folderId: 'lines-join-agency',
      approvalTimestamp: new Date('2024-01-01'),
      sourceUrl: 'http://example.com/lines-join-file-a.json'
    });
    await db.insert(tafs).values({
      fileId: 'lines-join-file-a',
      tafsId: '900-0001',
      tafsTableId,
      iteration: 1,
      fiscalYear: 2025,
      cgacAgency: '900',
      cgacAcct: '0001',
      accountId: '900-0001',
      budgetAgencyTitle: 'Lines Join Agency',
      budgetAgencyTitleId: 'lines-join-agency',
      budgetBureauTitle: 'Lines Join Bureau',
      budgetBureauTitleId: 'lines-join-bureau'
    });
    await db.insert(lines).values([
      {
        tafsTableId,
        lineIndex: 0,
        fileId: 'lines-join-file-a',
        lineNumber: '1000',
        lineDescription: 'First line'
      },
      {
        tafsTableId,
        lineIndex: 1,
        fileId: 'lines-join-file-a',
        lineNumber: '2000',
        lineDescription: 'Second line'
      }
    ]);
    await db.insert(footnotes).values([
      {
        fileId: 'lines-join-file-a',
        lineIndex: 0,
        footnoteNumber: 'A1',
        footnoteText: 'Footnote one'
      },
      {
        fileId: 'lines-join-file-a',
        lineIndex: 1,
        footnoteNumber: 'A2',
        footnoteText: 'Footnote two'
      }
    ]);
  });

  afterEach(async () => {
    // Restore unconditionally (not just on the happy path) so a spy from a
    // failing test never leaks captured SQL into a later test.
    vi.restoreAllMocks();
    await dbSetup.teardown();
  });

  test('accountSearchPaged does not join lines when not filtering by line number', async () => {
    const { executedSql } = spyOnExecutedSql();

    await accountSearchPaged({
      folder: 'lines-join-agency',
      accountOffset: 0,
      accountLimit: 10
    } as SearchPaginationParams);

    const aggregateQuerySql = executedSql().find((sql) => sql.includes('array_agg'));
    expect(aggregateQuerySql).toBeDefined();
    expect(aggregateQuerySql).not.toMatch(/join "lines"/i);
  });

  test('fileSearchPaged id-selection query does not join lines when not filtering by line number', async () => {
    const { executedSql } = spyOnExecutedSql();

    await fileSearchPaged({
      folder: 'lines-join-agency',
      offset: 0,
      limit: 20
    } as SearchPaginationParams);

    const idSelectionSql = executedSql().find(
      (sql) => sql.includes('from "files"') && sql.includes('group by')
    );
    expect(idSelectionSql).toBeDefined();
    expect(idSelectionSql).not.toMatch(/join "lines"/i);
  });

  // Note: tafsSearchPaged()/mTafsSearchPaged() are not covered here. They are
  // not reachable from any production route (every page/API route uses
  // fileSearchPaged/accountSearchPaged instead), and separately have a
  // pre-existing, unrelated bug where the default sort order references
  // columns not present in the `SELECT DISTINCT` list. Out of scope for this
  // fix — flagged to the Developer rather than addressed here.

  test('full-count queries do not join lines when not filtering by line number', async () => {
    const { executedSql } = spyOnExecutedSql();

    await Promise.all([
      fileSearchFullCountQuery({ folder: 'lines-join-agency' } as SearchPaginationParams),
      tafsSearchFullCountQuery({ folder: 'lines-join-agency' } as SearchPaginationParams),
      tafsSearchFullFileCountQuery({ folder: 'lines-join-agency' } as SearchPaginationParams),
      accountSearchFullCountQuery({ folder: 'lines-join-agency' } as SearchPaginationParams)
    ]);

    for (const sql of executedSql()) {
      expect(sql).not.toMatch(/join "lines"/i);
    }
  });

  test('lineNum filter still correctly restricts results via a subquery, without requiring a lines join', async () => {
    const matchingResults = await fileSearchPaged({
      folder: 'lines-join-agency',
      lineNum: ['1000'],
      offset: 0,
      limit: 20
    } as SearchPaginationParams);
    expect(matchingResults.map((result) => result?.fileId)).toEqual(['lines-join-file-a']);

    const nonMatchingResults = await fileSearchPaged({
      folder: 'lines-join-agency',
      lineNum: ['9999'],
      offset: 0,
      limit: 20
    } as SearchPaginationParams);
    expect(nonMatchingResults).toHaveLength(0);
  });
});

describe('account number (tafs) search', () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  // One file per TAFS so matches can be asserted by file ID.
  const tafsRows = [
    {
      key: 'multi-year',
      tafsId: '070-0613-2025-2029',
      tafsFormattedId: '070-0613 2025/2029'
    },
    {
      key: 'single-year',
      tafsId: '069-0130-2029-2029',
      tafsFormattedId: '069-0130 /2029'
    },
    { key: 'no-year', tafsId: '080-1200', tafsFormattedId: '080-1200 /X' },
    // Simulates a row loaded before tafs_formatted_id existed and not backfilled.
    { key: 'legacy-null', tafsId: '012-3510-2020-2021', tafsFormattedId: null }
  ];

  /**
   * Run a search on the TAS field, scoped to this test's folder, and return
   * the matching file keys sorted.
   */
  async function searchTafs(input: string): Promise<string[]> {
    const results = await fileSearchPaged({
      folder: 'tafs-search-agency',
      tafs: input,
      offset: 0,
      limit: 20
    } as SearchPaginationParams);
    return results.map((result) => `${result?.fileId}`.replace('tafs-search-', '')).toSorted();
  }

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();

    for (const row of tafsRows) {
      const fileId = `tafs-search-${row.key}`;
      await db.insert(files).values({
        fileId,
        fileType: apportionmentTypeStandard,
        folder: 'TAFS Search Agency',
        folderId: 'tafs-search-agency',
        sourceUrl: `http://example.com/${fileId}.json`
      });
      await db.insert(tafs).values({
        fileId,
        tafsId: row.tafsId,
        tafsFormattedId: row.tafsFormattedId,
        iteration: 1,
        fiscalYear: 2025,
        cgacAgency: row.tafsId.split('-')[0],
        cgacAcct: row.tafsId.split('-')[1],
        accountId: row.tafsId.split('-').slice(0, 2).join('-')
      });
    }
  });

  afterEach(async () => {
    await dbSetup.teardown();
  });

  test('matches the full displayed format', async () => {
    expect(await searchTafs('070-0613 2025/2029')).toEqual(['multi-year']);
  });

  test('matches a period of availability with a slash', async () => {
    expect(await searchTafs('2025/2029')).toEqual(['multi-year']);
  });

  test('"/2029" matches both multi-year and single-year periods ending in 2029', async () => {
    expect(await searchTafs('/2029')).toEqual(['multi-year', 'single-year']);
  });

  test('" /2029" with a leading space matches only single-year accounts', async () => {
    expect(await searchTafs(' /2029')).toEqual(['single-year']);
  });

  test('matches account plus start of period', async () => {
    expect(await searchTafs('070-0613 2025')).toEqual(['multi-year']);
  });

  test('matches no-year accounts with "/X"', async () => {
    expect(await searchTafs('/X')).toEqual(['no-year']);
  });

  test('still matches the hyphenated TAFS ID used by subscriptions and older URLs', async () => {
    expect(await searchTafs('070-0613-2025-2029')).toEqual(['multi-year']);
    expect(await searchTafs('012-3510-2020')).toEqual(['legacy-null']);
  });

  test('treats LIKE wildcards literally', async () => {
    expect(await searchTafs('%')).toEqual([]);
    expect(await searchTafs('_')).toEqual([]);
  });

  test('ignores whitespace-only input', async () => {
    expect(await searchTafs('   ')).toEqual([
      'legacy-null',
      'multi-year',
      'no-year',
      'single-year'
    ]);
  });
});
