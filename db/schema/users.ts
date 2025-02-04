/*
 * User accounts & authentication
 * Setup with Auth.js
 * https://authjs.dev/getting-started/adapters/drizzle
 */

// Dependencies
import { boolean, timestamp, pgTable, text, primaryKey, integer } from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';
import { relations } from 'drizzle-orm';
import { searches } from './searches';
import { subscriptions } from './subscriptions';

// User Table
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),

  // Meta
  createdAt: timestamp('created_at').defaultNow(),
  modifiedAt: timestamp('modified_at').defaultNow()
});

/**
 * Make relations to other tables
 */
export const usersRelations = relations(users, ({ many }) => ({
  searches: many(searches),
  subscriptions: many(subscriptions)
}));

// Additional tables
export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),

    // Meta
    createdAt: timestamp('created_at').defaultNow(),
    modifiedAt: timestamp('modified_at').defaultNow()
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId]
    })
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull()
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull()
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token]
    })
  })
);

export const authenticators = pgTable(
  'authenticator',
  {
    credentialId: text('credential_id').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerAccountId: text('provider_account_id').notNull(),
    credentialPublicKey: text('credential_public_key').notNull(),
    counter: integer('counter').notNull(),
    credentialDeviceType: text('credential_device_type').notNull(),
    credentialBackedUp: boolean('credential_backed_up').notNull(),
    transports: text('transports')
  },
  (authenticator) => ({
    compositePK: primaryKey({
      columns: [authenticator.userId, authenticator.credentialId]
    })
  })
);
