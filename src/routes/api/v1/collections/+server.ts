// Dependencies
import { json } from '@sveltejs/kit';
import { completed } from '$queries/collections';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  return json({
    query: {},
    results: await completed()
  });
}
