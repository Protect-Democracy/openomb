// Dependencies
import { json } from '@sveltejs/kit';
import { recentlyApproved } from '$db/queries/files';
import { environmentVariables, packageJson } from '../../../../../server/utilities';

// Environment variables
const env = environmentVariables();

/**
 * Health endpoint
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  let database = false;
  try {
    await recentlyApproved(1);
    database = true;
  }
  catch {
    database = false;
  }

  return json({
    query: {},
    results: {
      health: 'ok',
      sentry: !!env.sentryDsn,
      database,
      environment: env.environment,
      version: packageJson?.version
    }
  });
}
