/*
 * Saved searches
 */

// Dependencies
import { isDate } from 'lodash-es';
import { timestamp, pgTable, text, json, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { searchCriterionDescriptions, parseCriterion } from '$lib/searches';
import { users } from './users';

// This should be the source of truth for search fields.
//
// When changing search criterion, also refer to the parsing functions in src/lib/searches.ts.
export type SavedSearchCriterion = {
  // General keyword search across multiple fields
  term?: string[];
  // TAFS keyword search
  tafs?: string;
  // Account keyword
  account?: string;
  // This is an ID that combines agency and bureau, split with a comma, and can just
  // be agency.
  agencyBureau?: string;
  // Approver Ids
  approver?: string[];
  year?: number[];
  lineNum?: string[];
  footnoteNum?: string[];
  apportionmentType?: ('letter' | 'spreadsheet')[];
  approvedStart?: Date;
  approvedEnd?: Date;
};

// We have to support this old version of data in the database where things
// were strings.  Note that this should allow for the SavedSearchCriterion
// types in here as well.
export interface LegacySearchCriterion {
  term?: string | string[];
  tafs?: string;
  account?: string;
  agencyBureau?: string;
  approver?: string | string[];
  year?: string | number[];
  lineNum?: string | string[];
  footnoteNum?: string | string[];
  apportionmentType?: string | string[];
  approvedStart?: string | Date;
  approvedEnd?: string | Date;
}

export type SavedSearchCriterionKeys = keyof SavedSearchCriterion;

// What a search criterion looks like in the URL.
export type SavedSearchCriterionUrl = {
  [K in keyof SavedSearchCriterion]: string;
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
    criterion: json('criterion').$type<LegacySearchCriterion>(),

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
 * Compute parsed description value.
 *
 * Describes the criterion in text
 *
 */
export function searchCriterionDescription(
  searchesRecord: typeof searches.$inferSelect | undefined
): string {
  const noFiltersDescription = '(no filters)';

  if (!searchesRecord?.criterion) {
    return noFiltersDescription;
  }

  const descriptions = searchCriterionDescriptions(parseCriterion(searchesRecord.criterion));
  return descriptions && descriptions.length > 0 ? descriptions.join('; ') : noFiltersDescription;
}

/**
 * Export some types
 */
export type searchesSelect = typeof searches.$inferSelect;
export type searchesInsert = typeof searches.$inferInsert;
