// Dependencies
import { dbConnect } from '$db/connection.js';
import { completed } from '$queries/collections';
import { cachedJson } from '$lib/responses';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  await dbConnect();

  return cachedJson({
    query: {},
    results: await completed()
  });
}
