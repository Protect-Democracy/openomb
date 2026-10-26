// Dependencies
import { json } from '@sveltejs/kit';
import { recentlyApproved } from '$db/queries/files';
import { packageJson } from '$server/utilities';
import env from '$lib/environment';

/**
 * Health endpoint
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  let database = false;
  try {
    await recentlyApproved(1);
    database = true;
  } catch {
    // Leave as false; the health check reports the database as unavailable
  }

  return json({
    query: {},
    results: {
      health: 'ok',
      sentry: !!env.sentrySvelteDsn,
      database,
      environment: env.environment,
      version: packageJson?.version
    }
  });
}
