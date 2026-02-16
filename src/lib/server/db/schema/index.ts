/**
 * Place to collect all schemas
 */

import { collections } from './collections';
import { files } from './files';
import { footnotes } from './footnotes';
import { lines } from './lines';
import { lineDescriptions } from './line-descriptions';
import { lineTypes } from './line-types';
import { searches } from './searches';
import { subscriptions } from './subscriptions';
import { tafs } from './tafs';
import { users, accounts, sessions, verificationTokens, authenticators } from './users';

const allSchemas = {
  collections,
  files,
  footnotes,
  lines,
  lineDescriptions,
  lineTypes,
  searches,
  subscriptions,
  tafs,
  users,
  accounts,
  sessions,
  verificationTokens,
  authenticators
};

export {
  collections,
  files,
  footnotes,
  lines,
  lineDescriptions,
  lineTypes,
  searches,
  subscriptions,
  tafs,
  users,
  accounts,
  sessions,
  verificationTokens,
  authenticators,
  allSchemas
};
