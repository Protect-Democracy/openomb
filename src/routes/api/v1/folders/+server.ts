// Dependencies
import { dbConnect } from '$db/connection.js';
import { folders } from '$queries/files';
import { cachedJson } from '$lib/responses';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  await dbConnect();

  return cachedJson({
    query: {},
    results: await folders()
  });
}
