// Dependencies
import type { Config } from 'drizzle-kit';
import { environmentVariables } from './src/lib/server/utilities';

// Constants
const env = environmentVariables();

export default {
  schema: './src/lib/server/db/schema/*.ts',
  out: './src/lib/server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.dbUri
  }
} satisfies Config;
