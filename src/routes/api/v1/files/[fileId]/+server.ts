// Dependencies
import { error } from '@sveltejs/kit';
import { dbConnect } from '$db/connection.js';
import { fileDetails } from '$queries/files';
import { apiResponse } from '$lib/api';

/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ params, url }) {
  await dbConnect();

  // Any query parameters
  const sourceData = !!(url.searchParams.get('sourceData') || '');

  // Get file
  const file = await fileDetails(params.fileId, sourceData);

  if (!file) {
    // TODO: Respond with JSON
    error(404, 'Unable to find file');
  }

  return apiResponse({
    query: {
      sourceData
    },
    results: file
  });
}
