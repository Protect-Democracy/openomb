// Dependencies
import { json } from '@sveltejs/kit';
import { dbConnect } from '$db/connection.js';
import { folders } from '$queries/files';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  await dbConnect();

  return json({
    query: {},
    results: await folders()
  });
}
