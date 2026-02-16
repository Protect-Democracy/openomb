/**
 * Line types schema.
 */

// Dependencies
import { integer, pgTable, index, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * Schedule line types schema.
 */
export const lineTypes = pgTable(
  'line_types',
  {
    lineTypeId: varchar('line_type_id').primaryKey(),
    name: varchar('name').notNull(),
    lowerLimit: integer('lower_limit'),
    upperLimit: integer('upper_limit'),

    // Meta
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (lineTypes) => {
    return {
      // Indexes.  We will likely need to search or group on all of these fields
      lineTypeNameIndex: index('line_type_name_index').on(lineTypes.name),
      lineTypeLowerLimitIndex: index('line_type_lower_limit_index').on(lineTypes.lowerLimit),
      lineTypeUpperLimitIndex: index('line_type_upper_limit_index').on(lineTypes.upperLimit)
    };
  }
);

/**
 * Export some types
 */
export type lineTypesSelect = typeof lineTypes.$inferSelect;
export type lineTypesInsert = typeof lineTypes.$inferInsert;
