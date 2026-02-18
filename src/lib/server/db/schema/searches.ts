/*
 * Saved searches
 */

// Dependencies
import { isDate } from 'lodash';
import { timestamp, pgTable, text, json, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { formatDate } from '$lib/formatters';
import { users } from './users';

// Criterion fields.  This should be the source of truth saved search fields.
// We have to support the idea that the values are stored as strings in the DB,
// but going forward, we want to use the appropriate types in the codebase, so we
// will parse them on the way in and out of the DB.
export interface SavedSearchCriterion {
  // In the search interface

  // General keyword search across multiple fields
  term?: string | string[];
  // TAFS keyword search
  tafs?: string;
  // Account keyword
  account?: string;
  // Agency bureau are a single select, and use agencyBureau in the URL
  agency?: string;
  bureau?: string;
  // Multiple inputs
  approver?: string | string[];
  year?: string | number[];
  lineNum?: string | string[];
  footnoteNum?: string | string[];
  apportionmentType?: string | string[];
  approvedStart?: string | Date;
  approvedEnd?: string | Date;
}

// Parsed Criterion.  This is the ideal format.
export type ParsedSavedSearchCriterion = {
  term?: string[];
  tafs?: string;
  account?: string;
  agency?: string;
  bureau?: string;
  approver?: string[];
  year?: number[];
  lineNum?: string[];
  footnoteNum?: string[];
  apportionmentType?: string[];
  approvedStart?: Date;
  approvedEnd?: Date;
};

export type SavedSearchCriterionKeys = keyof SavedSearchCriterion;

// Probably doesn't need to be exported, mostly just an internal type
export type SavedSearchCriterionStrings = {
  [K in keyof SavedSearchCriterion]: string;
};

// What a search criterion looks like in the URL.  This is what we get from the user and then parse into the above type.
export type SavedSearchCriterionUrl = Omit<SavedSearchCriterionStrings, 'agency' | 'bureau'> & {
  agencyBureau?: string;
};

// Table
export const searches = pgTable(
  'searches',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Criterion for search is saved in JSON format for future flexibility
    criterion: json('criterion').$type<SavedSearchCriterion>(),

    // Meta
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (searches) => {
    return {
      // Indexes.  We will likely need to search or group on all of these fields
      userIdIndex: index('search_user_id_index').on(searches.userId)
    };
  }
);

/**
 * Make relations to other tables
 */
export const searchesRelations = relations(searches, ({ one }) => ({
  user: one(users, {
    fields: [searches.userId],
    references: [users.id]
  })
}));

/**
 * Make sure the criterion is in the correct format for saving.
 */
export function parseCriterion(
  criterion: SavedSearchCriterionUrl | SavedSearchCriterion | ParsedSavedSearchCriterion | undefined
): ParsedSavedSearchCriterion {
  if (!criterion) {
    return {};
  }

  // The URL version could have agencyBureau
  const agencyBureau =
    'agencyBureau' in criterion && typeof criterion?.agencyBureau === 'string'
      ? criterion.agencyBureau?.split(',')
      : [];

  return {
    term: Array.isArray(criterion?.term)
      ? criterion.term
      : criterion.term
        ? criterion.term.split(',').map((s) => s.trim())
        : undefined,
    tafs: criterion.tafs,
    account: criterion.account,
    agency:
      'agency' in criterion && criterion.agency ? criterion.agency : agencyBureau?.[0] || undefined,
    bureau:
      'bureau' in criterion && criterion.bureau ? criterion.bureau : agencyBureau?.[1] || undefined,
    approver: Array.isArray(criterion?.approver)
      ? criterion.approver
      : criterion.approver
        ? criterion.approver.split(',').map((s) => s.trim())
        : undefined,
    year: Array.isArray(criterion?.year)
      ? criterion.year
      : criterion.year
        ? criterion.year.split(',').map((y) => parseInt(y.trim()))
        : undefined,
    lineNum: Array.isArray(criterion?.lineNum)
      ? criterion.lineNum
      : criterion.lineNum
        ? criterion.lineNum.split(',').map((s) => s.trim())
        : undefined,
    footnoteNum: Array.isArray(criterion?.footnoteNum)
      ? criterion.footnoteNum
      : criterion.footnoteNum
        ? criterion.footnoteNum.split(',').map((s) => s.trim())
        : undefined,
    apportionmentType: Array.isArray(criterion?.apportionmentType)
      ? criterion.apportionmentType
      : criterion.apportionmentType
        ? criterion.apportionmentType.split(',').map((s) => s.trim())
        : undefined,
    approvedStart: isDate(criterion.approvedStart)
      ? criterion.approvedStart
      : criterion.approvedStart
        ? new Date(criterion.approvedStart)
        : undefined,
    approvedEnd: isDate(criterion.approvedEnd)
      ? criterion.approvedEnd
      : criterion.approvedEnd
        ? new Date(criterion.approvedEnd)
        : undefined
  };
}

/**
 * Convert from SavedSearchCriterion to SavedSearchCriterionUrl
 *
 * Converting arrays to comma separated strings and combining agency and bureau into agencyBureau
 */
export function criterionToUrl(criterion: SavedSearchCriterion): SavedSearchCriterionUrl {
  return {
    ...criterion,
    term: criterion.term
      ? Array.isArray(criterion.term)
        ? criterion.term.join(',')
        : criterion.term
      : undefined,
    agencyBureau: [criterion.agency, criterion.bureau].filter(Boolean).join(',') || undefined,
    approver: Array.isArray(criterion.approver) ? criterion.approver.join(',') : criterion.approver,
    year: Array.isArray(criterion.year) ? criterion.year.join(',') : criterion.year,
    lineNum: Array.isArray(criterion.lineNum) ? criterion.lineNum.join(',') : criterion.lineNum,
    footnoteNum: Array.isArray(criterion.footnoteNum)
      ? criterion.footnoteNum.join(',')
      : criterion.footnoteNum,
    apportionmentType: Array.isArray(criterion.apportionmentType)
      ? criterion.apportionmentType.join(',')
      : criterion.apportionmentType,
    approvedStart: isDate(criterion.approvedStart)
      ? criterion.approvedStart.toISOString().split('T')[0]
      : undefined,
    approvedEnd: isDate(criterion.approvedEnd)
      ? criterion.approvedEnd.toISOString().split('T')[0]
      : undefined
  };
}

/**
 * Compute parsed description value.
 *
 * Describes the criterion in text
 *
 */
export const searchCriterionDescription = (
  searchesRecord: typeof searches.$inferSelect | undefined
): string => {
  const noFiltersDescription = '(no filters)';

  if (!searchesRecord?.criterion) {
    return noFiltersDescription;
  }

  const criterionArray: Array<string> = [];
  const criterion = searchesRecord.criterion;

  if (criterion.term) {
    criterionArray.push(`'${criterion.term}'`);
  }
  if (criterion.tafs) {
    criterionArray.push(`TAFS: ${criterion.tafs}`);
  }
  if (criterion.agency) {
    criterionArray.push(`Agency: ${criterion.agency}`);
  }
  if (criterion.bureau) {
    criterionArray.push(`Bureau: ${criterion.bureau}`);
  }
  if (criterion.account) {
    criterionArray.push(`Account: ${criterion.account}`);
  }
  if (criterion.approver) {
    criterionArray.push(`Approver: ${criterion.approver}`);
  }
  if (criterion.year) {
    criterionArray.push(
      `Year(s): ${typeof criterion.year === 'string' ? criterion.year : criterion.year.join(', ')}`
    );
  }
  if (criterion.lineNum) {
    criterionArray.push(
      `Line #: ${typeof criterion.lineNum === 'string' ? criterion.lineNum : criterion.lineNum.join(', ')}`
    );
  }
  if (criterion.footnoteNum) {
    criterionArray.push(
      `Footnote(s): ${typeof criterion.footnoteNum === 'string' ? criterion.footnoteNum : criterion.footnoteNum.join(', ')}`
    );
  }
  if (criterion.apportionmentType) {
    criterionArray.push(
      `Apportionment Type(s): ${typeof criterion.apportionmentType === 'string' ? criterion.apportionmentType : criterion.apportionmentType.join(', ')}`
    );
  }
  if (criterion.approvedStart) {
    criterionArray.push(`Approved After: ${formatDate(criterion.approvedStart, 'short')}`);
  }
  if (criterion.approvedEnd) {
    criterionArray.push(`Approved Before: ${formatDate(criterion.approvedEnd, 'short')}`);
  }

  return criterionArray.length >= 1 ? criterionArray.join('; ') : noFiltersDescription;
};

/**
 * Export some types
 */
export type searchesSelect = typeof searches.$inferSelect;
export type searchesInsert = typeof searches.$inferInsert;
