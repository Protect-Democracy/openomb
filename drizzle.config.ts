// Dependencies
import type { Config } from 'drizzle-kit';
import { environment_variables } from './src/lib/utilities';

// Constants
const env = environment_variables();

export default {
  schema: './db/schema/*.ts',
  out: './db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: env.dbUri
  }
} satisfies Config;
