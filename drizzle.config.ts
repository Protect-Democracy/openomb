// Dependencies
import type { Config } from 'drizzle-kit';
import { environmentVariables } from './server/utilities';

// Constants
const env = environmentVariables();

export default {
  schema: './db/schema/*.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.dbUri
  }
} satisfies Config;
