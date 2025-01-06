/*
 * Saved searches
 */

// Dependencies
import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  json,
  index
} from "drizzle-orm/pg-core"
import { relations } from 'drizzle-orm';
import { users } from './users';

// Table
export const searches = pgTable(
  'searches',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
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
      userIdIndex: index('search_user_id_index').on(searches.userId),
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
  }),
}));
