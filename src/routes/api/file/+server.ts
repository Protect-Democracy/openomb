// Dependencies
import { error } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { type RequestHandler } from '@sveltejs/kit';
import { db } from '$db/connection.js';
import { file } from '$schema/files.js';
import { eq } from 'drizzle-orm';

/**
 * Get a specific file by ID
 */
export const GET: RequestHandler = async ({ url }) => {
  // File id
  const fileId = url.searchParams.get('fileId') || '';

  // Look for file.
  // TODO: Do we want to not include the sourceData unless requested?
  const files = await db.select().from(file).where(eq(file.fileId, fileId)).limit(1);

  if (!files || files.length !== 1) {
    // TODO: Respond with JSON
    error(404, 'Unable to find file');
  }

  return json(files[0]);
};
