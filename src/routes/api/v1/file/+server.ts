// Dependencies
import { error } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { dbConnect } from '$db/connection.js';
import { fileDetails } from '$queries/files';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  await dbConnect();
  // File id
  const fileId = url.searchParams.get('fileId') || '';

  // Look for file.
  // TODO: Do we want to not include the sourceData unless requested?
  const file = await fileDetails(fileId);

  if (!file) {
    // TODO: Respond with JSON
    error(404, 'Unable to find file');
  }

  return json(file);
}
