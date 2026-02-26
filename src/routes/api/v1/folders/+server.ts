// Dependencies
import { json } from '@sveltejs/kit';
import { folders } from '$queries/folders';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  return json({
    query: {},
    results: await folders()
  });
}
