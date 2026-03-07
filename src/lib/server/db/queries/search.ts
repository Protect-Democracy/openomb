// Dependencies
import {
  ilike,
  and,
  or,
  eq,
  gte,
  lte,
  isNotNull,
  isNull,
  count,
  countDistinct,
  asc,
  desc,
  inArray,
  sql,
  SQL
} from 'drizzle-orm';
import debug from 'debug';
import { db } from '$db/connection';
import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { lines } from '$schema/lines';
import { footnotes } from '$schema/footnotes';
import { searches } from '$schema/searches';
import { parseCriterion } from '$lib/searches';
import { users } from '$schema/users';
import { lineTypes } from '$schema/line-types';
import { lineDescriptions } from '$schema/line-descriptions';
import { memoizeDataAsync } from '$server/cache';
import { apportionmentTypeSpendPlan, apportionmentTypeStandard } from '$config/files';

// Types
import { type PgColumn, type SelectedFields } from 'drizzle-orm/pg-core';
import type { LegacySearchCriterion, SavedSearchCriterion, searchesSelect } from '$schema/searches';

export type ColumnObject = {
  [key: string]: PgColumn | SelectedFields | SQL;
};

// Search fields
export type SupplementalSearchCriterion = {
  // Search criterion that is not saved in the search model and may
  // or may not be in the UI itself.
  folder?: string;
  createdStart?: Date;
  createdEnd?: Date;
};

export type CombinedSearchCriterion = SavedSearchCriterion & SupplementalSearchCriterion;

// Paging and sorting
export type PaginationParams = {
  offset: number;
  limit: number;
  sort?: string;
};

export type AccountPaginationParams = {
  accountOffset?: number;
  accountLimit?: number;
  accountSort?: string;
};

export type CombinedPaginationParams = PaginationParams & AccountPaginationParams;

// Search and paging
export type SearchPaginationParams = CombinedSearchCriterion & CombinedPaginationParams;

// Debugger
const debugLogger = debug('apportionments:queries-search');

/**
 * Get all existing fiscal year values
 */
export async function yearOptions() {
  const yearOptions = await db
    .selectDistinct({ data: files.fiscalYear })
    .from(files)
    .where(isNotNull(files.fiscalYear));

  return yearOptions.map((v) => v.data).filter(Boolean) as number[];
}
export type YearOptionsResult = Awaited<ReturnType<typeof yearOptions>>;
export const mYearOptions = memoizeDataAsync(yearOptions);

/**
 * Get all existing approver title options
 */
export async function approverTitleOptions() {
  const approverOptions = await db
    .selectDistinct({ value: files.approverTitleId, label: files.approverTitle })
    .from(files)
    .where(isNotNull(files.approverTitleId))
    .orderBy(files.approverTitle);

  return approverOptions;
}
export type ApproverTitleOptionsResult = Awaited<ReturnType<typeof approverTitleOptions>>;
export const mApproverTitleOptions = memoizeDataAsync(approverTitleOptions);

/**
 * Get line description options.
 */
export const lineNumberOptions = async function () {
  // Get line descriptions for line numbers that are in the data
  // as line descriptions data is a full set of line numbers but not
  // necessarily all are used.
  const results = await db
    .selectDistinct({
      lineNumber: lines.lineNumber,
      description: lineDescriptions.description,
      lineTypeId: lines.lineTypeId,
      lineType: lineTypes.name
    })
    .from(lines)
    .leftJoin(lineDescriptions, eq(lines.lineNumber, lineDescriptions.lineNumber))
    .leftJoin(lineTypes, eq(lines.lineTypeId, lineTypes.lineTypeId))
    .where(isNotNull(lines.lineNumber))
    .orderBy(asc(lines.lineNumber));

  if (!results) {
    return [];
  }

  // Format for options
  return results.map((v) => {
    return {
      value: v.lineNumber,
      label: v.description ? `${v.lineNumber} - ${v.description}` : `${v.lineNumber} - (unknown)`,
      groupValue: v.lineTypeId || 'other',
      groupLabel: v.lineType || 'Other'
    };
  });
};
export type LineNumberOptionsResult = Awaited<ReturnType<typeof lineNumberOptions>>;
export const mLineNumberOptions = memoizeDataAsync(lineNumberOptions);

/**
 * Ensure that our file contains all keywords at least once.
 * Multiple keywords are expected to be separated by commas within string
 *
 * @param searchTerm Keywords
 * @param column Table column to compare against
 * @returns
 */
function keywordSearch(keywordTerms: string[], mainTable: 'files' | 'tafs' = 'files') {
  const lineSearch = (keyword: string) => {
    if (mainTable === 'tafs') {
      return inArray(
        tafs.tafsTableId,
        db
          .selectDistinct({ tafsTableId: lines.tafsTableId })
          .from(lines)
          .where(ilike(lines.lineDescription, `%${keyword}%`))
      );
    }

    return inArray(
      files.fileId,
      db
        .selectDistinct({ fileId: lines.fileId })
        .from(lines)
        .where(ilike(lines.lineDescription, `%${keyword}%`))
    );
  };

  const footnoteSearch = (keyword: string) => {
    if (mainTable === 'tafs') {
      return inArray(
        tafs.tafsTableId,
        db
          .selectDistinct({ tafsTableId: lines.tafsTableId })
          .from(lines)
          .innerJoin(
            footnotes,
            and(eq(lines.fileId, footnotes.fileId), eq(lines.lineIndex, footnotes.lineIndex))
          )
          .where(ilike(footnotes.footnoteText, `%${keyword}%`))
      );
    }
    return inArray(
      files.fileId,
      db
        .selectDistinct({ fileId: footnotes.fileId })
        .from(footnotes)
        .where(ilike(footnotes.footnoteText, `%${keyword}%`))
    );
  };

  // If we have keywords separated by commas, separate these and use in search
  // TODO: Is this more expensive than doing a LIKE ALL|ANY (ARRAY['%term%', '%other%', '%thing%'])
  return and(
    ...keywordTerms.map((keyword) =>
      or(
        ilike(tafs.accountTitle, `%${keyword}%`),
        ilike(tafs.budgetAgencyTitle, `%${keyword}%`),
        ilike(tafs.budgetBureauTitle, `%${keyword}%`),
        ilike(files.fundsProvidedByParsed, `%${keyword}%`),
        ilike(files.sourceText, `%${keyword}%`),
        lineSearch(keyword),
        footnoteSearch(keyword)
      )
    )
  );
}

/**
 * Create the set of WHERE clauses to use for searching.  Adjusts slightly
 * depending on the primary table that is being searched.
 *
 * @param searchParams Search (and optionally pagination) parameters
 * @param mainTable Should be tafs or files.
 * @returns
 */
function generalSearchFilters(
  searchParams: CombinedSearchCriterion | SearchPaginationParams,
  mainTable: 'files' | 'tafs' = 'files'
) {
  // Collect filters
  const where = [];

  // General search term
  where.push(searchParams.term?.length ? keywordSearch(searchParams.term, mainTable) : undefined);

  // Other search terms
  where.push(searchParams.tafs ? ilike(tafs.tafsId, `%${searchParams.tafs}%`) : undefined);
  where.push(
    searchParams.account ? ilike(tafs.accountTitle, `%${searchParams.account}%`) : undefined
  );

  // Agency bureau field.
  if (searchParams.agencyBureau) {
    const [agency, bureau] = searchParams.agencyBureau.split(',').map((s) => s.trim());
    if (agency) {
      where.push(eq(tafs.budgetAgencyTitleId, agency));
      if (bureau) {
        where.push(eq(tafs.budgetBureauTitleId, bureau));
      }
    }
  }

  // Identifiers
  where.push(searchParams.folder ? eq(files.folderId, searchParams.folder) : undefined);
  where.push(
    searchParams.approver?.length && searchParams.approver?.length > 0
      ? inArray(files.approverTitleId, searchParams.approver)
      : undefined
  );
  where.push(
    searchParams.lineNum?.length && searchParams.lineNum?.length > 0
      ? inArray(lines.lineNumber, searchParams.lineNum)
      : undefined
  );

  // Joining footnotes in our search is expensive, so we do a subquery
  const footnoteNumberFilters = (searchParams.footnoteNum || []).map((n) => {
    return ilike(footnotes.footnoteNumber, `${n}%`);
  });
  where.push(
    searchParams.footnoteNum?.length &&
      searchParams.footnoteNum?.length >= 1 &&
      mainTable === 'tafs'
      ? inArray(
          tafs.tafsTableId,
          db
            .selectDistinct({ tafsTableId: lines.tafsTableId })
            .from(lines)
            .innerJoin(
              footnotes,
              and(eq(lines.fileId, footnotes.fileId), eq(lines.lineIndex, footnotes.lineIndex))
            )
            .where(
              footnoteNumberFilters.length > 1
                ? or(...footnoteNumberFilters)
                : footnoteNumberFilters[0]
            )
        )
      : searchParams.footnoteNum?.length &&
          searchParams.footnoteNum?.length >= 1 &&
          mainTable === 'files'
        ? inArray(
            files.fileId,
            db
              .selectDistinct({ fileId: footnotes.fileId })
              .from(footnotes)
              .where(
                footnoteNumberFilters.length > 1
                  ? or(...footnoteNumberFilters)
                  : footnoteNumberFilters[0]
              )
          )
        : undefined
  );

  // Specific values
  where.push(
    searchParams.year?.length && searchParams.year?.length > 0
      ? inArray(files.fiscalYear, searchParams.year)
      : undefined
  );
  where.push(
    searchParams.approvedStart
      ? gte(files.approvalTimestamp, new Date(`${searchParams.approvedStart}T00:00:00Z`))
      : undefined
  );
  where.push(
    searchParams.approvedEnd
      ? lte(files.approvalTimestamp, new Date(`${searchParams.approvedEnd}T23:59:59Z`))
      : undefined
  );
  where.push(
    searchParams.createdStart ? gte(files.createdAt, searchParams.createdStart) : undefined
  );
  where.push(searchParams.createdEnd ? lte(files.createdAt, searchParams.createdEnd) : undefined);

  // Apportionment type.
  if (searchParams.apportionmentType && searchParams.apportionmentType.length > 0) {
    const apportionmentTypeFilters = [];
    if (searchParams.apportionmentType.includes('spreadsheet')) {
      apportionmentTypeFilters.push(
        and(isNull(files.pdfUrl), eq(files.fileType, apportionmentTypeStandard))
      );
    }
    if (searchParams.apportionmentType.includes('letter')) {
      apportionmentTypeFilters.push(
        and(isNotNull(files.pdfUrl), eq(files.fileType, apportionmentTypeStandard))
      );
    }
    if (searchParams.apportionmentType.includes('spend')) {
      apportionmentTypeFilters.push(eq(files.fileType, apportionmentTypeSpendPlan));
    }
    where.push(or(...apportionmentTypeFilters));
  }

  // Complete AND wheres
  const filteredWhere = where.filter((v) => !!v);
  const finalWhere =
    filteredWhere.length > 1
      ? and(...filteredWhere)
      : filteredWhere.length === 1
        ? filteredWhere[0]
        : undefined;
  return finalWhere;
}

/**
 * Given the search options, create options needed for searching
 * such as the where clause.
 *
 * @param searchParams Search pagination options
 * @returns
 */
export async function searchSetup(
  searchParams: CombinedSearchCriterion | SearchPaginationParams,
  mainTable: 'files' | 'tafs' = 'files'
) {
  const searchHasLines = !!searchParams.term || !!searchParams.lineNum?.length;
  const searchHasFootnotes = !!searchParams.term || !!searchParams.footnoteNum?.length;

  // Where
  const finalWhere = generalSearchFilters(searchParams, mainTable);

  // File order parameters.  Since we are grouping, we need to  order
  // by aggregate values.  Default is just to order by approval.
  let order = [desc(files.approvalTimestamp)];
  // TODO: Unsure why this throws the type issue
  if ('sort' in searchParams && searchParams.sort === 'approved_asc') {
    order = [asc(files.approvalTimestamp)];
  }
  if ('sort' in searchParams && searchParams?.sort === 'account_asc') {
    const aggField = sql`STRING_AGG(${tafs.accountTitle}, ',' ORDER BY ${tafs.accountTitle})`;
    order = [asc(aggField), desc(files.approvalTimestamp)];
  } else if ('sort' in searchParams && searchParams?.sort === 'bureau_asc') {
    const aggField = sql`STRING_AGG(${tafs.budgetBureauTitle}, ',' ORDER BY ${tafs.budgetBureauTitle})`;
    order = [asc(aggField), desc(files.approvalTimestamp)];
  } else if ('sort' in searchParams && searchParams?.sort === 'agency_asc') {
    const aggField = sql`STRING_AGG(${tafs.budgetAgencyTitle}, ',' ORDER BY ${tafs.budgetAgencyTitle})`;
    order = [asc(aggField), desc(files.approvalTimestamp)];
  }

  // Account ordering
  let accountOrder = [
    sql`STRING_AGG(${tafs.accountTitle}, ',' ORDER BY ${tafs.accountTitle})`,
    sql`string_agg(${tafs.budgetAgencyTitle}, ',' ORDER BY ${tafs.budgetAgencyTitle})`
  ];
  if ('accountSort' in searchParams && searchParams?.accountSort === 'account_desc') {
    accountOrder = [
      sql`STRING_AGG(${tafs.accountTitle}, ',' ORDER BY ${tafs.accountTitle} DESC) DESC`,
      sql`string_agg(${tafs.budgetAgencyTitle}, ',' ORDER BY ${tafs.budgetAgencyTitle} DESC) DESC`
    ];
  } else if ('accountSort' in searchParams && searchParams?.accountSort === 'file_count_desc') {
    accountOrder = [
      desc(countDistinct(tafs.fileId)),
      sql`STRING_AGG(${tafs.accountTitle}, ',' ORDER BY ${tafs.accountTitle})`
    ];
  }

  return {
    searchParams: searchParams,
    hasLines: searchHasLines,
    hasFootnotes: searchHasFootnotes,
    where: finalWhere,
    order,
    accountOrder
  };
}

export const mSearchSetup = memoizeDataAsync(searchSetup);

/**
 * Determine full count of tafs search.  Return just query so to be used
 * asynchronously if needed.  See tafsSearchFullCount() for direct results.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function tafsSearchFullCountQuery(
  searchParams: CombinedSearchCriterion | SearchPaginationParams
) {
  const { where } = await searchSetup(searchParams, 'tafs');

  const countSubquery = db
    .selectDistinct({
      tafsTableId: tafs.tafsTableId
    })
    .from(tafs)
    .leftJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    .where(where)
    .as('countSubquery');

  return db.select({ count: count() }).from(countSubquery);
}

export const mTafsSearchFullCountQuery = memoizeDataAsync(tafsSearchFullCountQuery);

/**
 * Determine full count of tafs search.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function tafsSearchFullCount(
  searchParams: CombinedSearchCriterion | SearchPaginationParams
) {
  const fullCount = await tafsSearchFullCountQuery(searchParams);

  return fullCount[0].count || 0;
}

export const mTafsSearchFullCount = memoizeDataAsync(tafsSearchFullCount);

/**
 * Determine full count of files for tafs search.  Return just query so to be used
 * asynchronously if needed.  See tafsSearchFullCount() for direct results.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function tafsSearchFullFileCountQuery(
  searchParams: CombinedSearchCriterion | SearchPaginationParams
) {
  const { where } = await searchSetup(searchParams, 'tafs');

  const countSubquery = db
    .selectDistinct({
      fileId: tafs.fileId
    })
    .from(tafs)
    .leftJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    .where(where)
    .as('countSubquery');

  return db.select({ count: count() }).from(countSubquery);
}

export const mTafsSearchFullFileCountQuery = memoizeDataAsync(tafsSearchFullFileCountQuery);

/**
 * Determine full count of files in tafs search.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function tafsSearchFullFileCount(
  searchParams: CombinedSearchCriterion | SearchPaginationParams
) {
  const fullCount = await tafsSearchFullFileCountQuery(searchParams);

  return fullCount[0].count || 0;
}

export const mTafsSearchFullFileCount = memoizeDataAsync(tafsSearchFullFileCount);

/**
 * Get the detailed search results for a search and page.
 *
 * @param searchParams Search and pagination options
 * @returns
 */
export async function tafsSearchPaged(searchParams: SearchPaginationParams) {
  const { where, order } = await searchSetup(searchParams, 'tafs');

  // Specific ids
  const pagedResults = await db
    .selectDistinct({
      tafsTableId: tafs.tafsTableId
    })
    .from(tafs)
    .leftJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    .leftJoin(footnotes, eq(tafs.fileId, footnotes.fileId))
    .where(where)
    .orderBy(...order)
    .offset(searchParams.offset)
    .limit(searchParams.limit);

  // Details.
  const tafsDetails = [];
  for (const pagedResult of pagedResults) {
    const details = await db.query.tafs.findFirst({
      where: eq(tafs.tafsTableId, pagedResult.tafsTableId?.toString() || ''),
      with: {
        file: true
      }
    });

    tafsDetails.push(details);
  }

  return tafsDetails;
}

export const mTafsSearchPaged = memoizeDataAsync(tafsSearchPaged);

/**
 * Find full count of accounts for a search; just query version for possible
 * asynchronous usage.
 *
 * @param searchParams
 * @returns
 */
export async function accountSearchFullCountQuery(
  searchParams: CombinedSearchCriterion | SearchPaginationParams
) {
  const { where } = await searchSetup(searchParams, 'tafs');

  const countSubquery = db
    .selectDistinct({
      fullAccountTitleId: sql`CONCAT(${tafs.budgetAgencyTitleId}, ${tafs.budgetBureauTitleId}, ${tafs.accountTitleId})`
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    // Explicitly not joining footnotes and searching via subquery (see where)
    //.leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(where)
    .as('countSubquery');

  return db.select({ count: count() }).from(countSubquery);
}

export const mAccountSearchFullCountQuery = memoizeDataAsync(accountSearchFullCountQuery);

/**
 * Determine full count of files in tafs search.
 *
 * @param searchParams Search parameters (don't include pagination parameters
 *   as this will allow for better caching)
 * @returns
 */
export async function accountSearchFullCount(
  searchParams: CombinedSearchCriterion | SearchPaginationParams
) {
  const fullCount = await accountSearchFullCountQuery(searchParams);

  return fullCount[0].count || 0;
}

export const mAccountSearchFullCount = memoizeDataAsync(accountSearchFullCount);

/**
 * Find relevant accounts from a general search.
 *
 * @param searchParams
 * @returns
 */
export async function accountSearchPaged(searchParams: SearchPaginationParams) {
  const { where, accountOrder } = await searchSetup(searchParams, 'tafs');

  // Find accounts.  We want to get a distinct list of accounts while
  // still searching many fields across multiple tables and also be able
  // to order and offset.  We're limited by having a sort as those fields
  // need to appear in a DISTINCT or in a GROUP BY
  // Subquery to filter the accounts
  const allAccounts = await db
    .select({
      budgetAgencyTitleId: tafs.budgetAgencyTitleId,
      budgetBureauTitleId: tafs.budgetBureauTitleId,
      accountTitleId: tafs.accountTitleId,
      // There is at least one account that has the same ID
      // but different title (mismatching case); this should be
      // fixed in the data, but just to make sure
      budgetAgencyTitle: sql`(array_agg(${tafs.budgetAgencyTitle} ORDER BY ${tafs.budgetAgencyTitle}))[1]`,
      budgetBureauTitle: sql`(array_agg(${tafs.budgetBureauTitle} ORDER BY ${tafs.budgetBureauTitle}))[1]`,
      accountTitle: sql`(array_agg(${tafs.accountTitle} ORDER BY ${tafs.accountTitle}))[1]`
    })
    .from(tafs)
    .innerJoin(files, eq(tafs.fileId, files.fileId))
    .leftJoin(lines, eq(tafs.fileId, lines.fileId))
    // Explicitly not joining footnotes and searching via subquery (see where)
    //.leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(where)
    .groupBy(tafs.budgetAgencyTitleId, tafs.budgetBureauTitleId, tafs.accountTitleId)
    .orderBy(...accountOrder)
    .offset(searchParams.accountOffset || 0)
    .limit(searchParams.accountLimit || 10);

  return allAccounts;
}

export const mAccountSearchPaged = memoizeDataAsync(accountSearchPaged);

/**
 * Query for full count of a file search, separated for asynchronous usage.
 *
 * @param searchParams
 * @returns
 */
export async function fileSearchFullCountQuery(
  searchParams: CombinedSearchCriterion | SearchPaginationParams
) {
  const { where } = await searchSetup(searchParams, 'files');

  const countSubquery = db
    .selectDistinct({
      fileId: files.fileId
    })
    .from(files)
    .leftJoin(tafs, eq(files.fileId, tafs.fileId))
    .leftJoin(lines, eq(files.fileId, lines.fileId))
    // Explicitly not joining footnotes and searching via subquery (see where)
    //.leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(where)
    .as('countSubquery');

  return db.select({ count: count() }).from(countSubquery);
}

export const mFileSearchFullCountQuery = memoizeDataAsync(fileSearchFullCountQuery);

/**
 * Perform full count of a file search.
 *
 * @param searchParams
 * @returns
 */
export async function fileSearchFullCount(
  searchParams: CombinedSearchCriterion | SearchPaginationParams
) {
  const fullCount = await fileSearchFullCountQuery(searchParams);

  return fullCount[0].count || 0;
}

export const mFileSearchFullCount = memoizeDataAsync(fileSearchFullCount);

/**
 * Search files with common search parameters for a specific page.
 *
 * @param searchParams
 * @returns
 */
export async function fileSearchPaged(searchParams: SearchPaginationParams) {
  debugLogger('File searchParams:', searchParams);
  const { where, hasLines, hasFootnotes, order } = await searchSetup(searchParams, 'files');

  // The meat of the query is that we want to find a set of distinct File IDs
  // but we want to order by an arbitrary set of fields.  We could use a DISTINCT
  // but then the ORDER BY has to be included in the select which makes the distinct
  // part different.  A GROUP BY and Window function have similar limitations.
  //
  // A subquery method to get the distinct list of File IDs could work but gets complicated
  // when we want to order on fields on TAFS or other one-to-many tables that
  // will cause more than one row to be returned for each File ID.
  //
  //
  const limitedIds = await db
    .select({
      fileId: files.fileId
    })
    .from(files)
    .leftJoin(tafs, eq(files.fileId, tafs.fileId))
    .leftJoin(lines, eq(files.fileId, lines.fileId))
    // Explicitly not joining footnotes and searching via subquery (see where),
    // but if we need to order by or select from footnotes we need to join
    //.leftJoin(footnotes, eq(files.fileId, footnotes.fileId))
    .where(where)
    .groupBy(files.fileId)
    .orderBy(...order)
    .offset(searchParams.offset)
    .limit(searchParams.limit);

  // Details.  Is there a better way to do this
  const detailsWith = {
    tafs: {
      // Specifically when ordering by account, we want the account
      // titles to be in alphabetical order.
      orderBy: [asc(tafs.accountTitle)],
      // Check lines
      ...(hasLines && {
        with: {
          lines: {
            orderBy: [asc(lines.lineNumber)]
          }
        }
      })
    },
    // Footnotes
    ...(hasFootnotes && {
      footnotes: {
        orderBy: [asc(footnotes.footnoteNumber)]
      }
    })
  };

  const fileDetails = [];
  for (const limitedId of limitedIds) {
    const details = await db.query.files.findFirst({
      columns: {
        sourceData: false
      },
      where: eq(files.fileId, limitedId.fileId),
      with: detailsWith
    });
    fileDetails.push(details);
  }

  return fileDetails;
}

export const mFileSearchPaged = memoizeDataAsync(fileSearchPaged);

/**
 * Save a search for the specified user
 * (Currently used only by subscriptions)
 */
export async function saveUserSearch(
  email: string | undefined,
  criterion: LegacySearchCriterion | SavedSearchCriterion
) {
  if (!email) {
    return null;
  }

  // Cut out of saving the search if it has already been saved
  const existingSearch = await userSearch(email, criterion);
  if (existingSearch) {
    return existingSearch;
  }

  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }

  // Make sure criterion is in the correct format for saving
  const criterionToSave = parseCriterion(criterion);

  const newSearch = {
    userId: userResults[0].id,
    criterion: criterionToSave
  };
  const newRecords = await db.insert(searches).values(newSearch).returning({ id: searches.id });
  return newRecords[0];
}

/**
 * Remove saved search(es) for user
 * (Currently used only by subscriptions)
 */
export async function removeUserSearches(email: string, searchId: string | Array<string>) {
  const userResults = await db.select().from(users).where(eq(users.email, email));
  // If we have no user, exit early
  if (!userResults?.[0]) {
    return null;
  }

  await db
    .delete(searches)
    .where(
      and(
        eq(searches.userId, userResults[0].id),
        Array.isArray(searchId) ? inArray(searches.id, searchId) : eq(searches.id, searchId)
      )
    );
}

/**
 * Get a user's saved search with a given criterion
 *
 * (Currently used only by subscriptions)
 *
 * Because the criterion could be in a legacy format, we get all the searches for
 * the user, parse the criterion, and then compare the parsed criterion to the input
 * criterion.  This is not super efficient but should be fine for the expected number
 * of saved searches per user and allows us to avoid having to update all existing
 * saved searches to have a parsed criterion column.
 */
export async function userSearch(
  email: string | undefined,
  criterion: LegacySearchCriterion | SavedSearchCriterion
): Promise<searchesSelect | undefined> {
  if (!email) {
    return;
  }

  // Get the user
  const userResults = await db.select().from(users).where(eq(users.email, email));

  // If we have no user, exit early
  if (!userResults?.[0]) {
    return;
  }

  // Get all searches for the user
  const searchesForUser = await db
    .select()
    .from(searches)
    .where(eq(searches.userId, userResults[0].id));

  // If no searches, exit early
  if (!searchesForUser || searchesForUser.length === 0) {
    return;
  }

  // Find a search with a criterion that matches the input criterion
  const parsedInputCriterion = parseCriterion(criterion);
  const matchingSearch = searchesForUser.find((search) => {
    const parsedSearchCriterion = parseCriterion(search.criterion || {});
    return JSON.stringify(parsedSearchCriterion) === JSON.stringify(parsedInputCriterion);
  });

  return matchingSearch;
}
