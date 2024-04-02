// Dependencies
import { error } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { db, dbConnect } from '$db/connection.js';
import { fileDetails } from '$queries/files';
import { eq } from 'drizzle-orm';

/**
 * Get a specific file by ID
 */
export const GET: RequestHandler = async ({ url }) => {
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
};
