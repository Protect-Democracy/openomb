// Dependencies
import { dbConnect } from '$db/connection.js';
import { completed } from '$queries/collections';
import { apiResponse } from '$lib/api';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  await dbConnect();

  return apiResponse({
    query: {},
    results: await completed()
  });
}
