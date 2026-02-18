/*
 * Notification subscriptions
 */

// Dependencies
import { timestamp, pgTable, text, varchar, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

// Table
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Type refers to entity being subscribed to (account, file, search)
    type: varchar('type').notNull(),
    // ItemId refers to the identifying key for the specific entity
    itemId: varchar('item_id').notNull(),
    frequency: varchar('frequency').notNull().default('daily'),
    // Set to current so that notifications occur on next interval after subscription
    lastNotifiedAt: timestamp('last_notified_at').defaultNow(),

    // Meta
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (subscriptions) => {
    return {
      // For foreign key reference we need a unique on these columns
      // These are a secondary combined key, but a separate id makes updating a given record easier
      subscriptionEntryUnique: unique()
        .on(subscriptions.userId, subscriptions.type, subscriptions.itemId)
        .nullsNotDistinct(),

      // Indexes.  We will likely need to search or group on all of these fields
      userIdIndex: index('subscription_user_id_index').on(subscriptions.userId),
      typeIndex: index('subscription_type_index').on(subscriptions.type),
      itemIdIndex: index('subscription_item_id_index').on(subscriptions.itemId),
      frequencyIndex: index('subscription_frequency_index').on(subscriptions.frequency)
    };
  }
);

/**
 * Make relations to other tables
 */
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id]
  })
}));

/**
 * Export some types
 */
export type subscriptionSelect = typeof subscriptions.$inferSelect;
export type subscriptionInsert = typeof subscriptions.$inferInsert;
