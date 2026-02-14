/*
 * Saved searches
 */

// Dependencies
import { timestamp, pgTable, text, json, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

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
    criterion: json('criterion'),

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
export const descriptionParsed = (
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
    criterionArray.push(`Year(s): ${criterion.year}`);
  }
  if (criterion.lineNum) {
    criterionArray.push(`Line #: ${criterion.lineNum}`);
  }
  if (criterion.footnoteNum) {
    criterionArray.push(`Footnote(s): ${criterion.footnoteNum}`);
  }

  return criterionArray.length >= 1 ? criterionArray.join('; ') : noFiltersDescription;
};

/**
 * Export some types
 */
export type searchesSelect = typeof searches.$inferSelect;
export type searchesInsert = typeof searches.$inferInsert;
