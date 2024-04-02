// Dependencies
import type { Config } from 'drizzle-kit';
import { environmentVariables } from './server/utilities';

// Constants
const env = environmentVariables();

export default {
  schema: './db/schema/*.ts',
  out: './db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: env.dbUri
  }
} satisfies Config;
