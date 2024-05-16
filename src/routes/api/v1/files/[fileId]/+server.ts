// Dependencies
import { json } from '@sveltejs/kit';
import { fileDetails } from '$queries/files';
/**
 * Get a specific file by ID
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ params, url }) {
  // Any query parameters
  const sourceData = !!(url.searchParams.get('sourceData') || '');

  // Get file
  const file = await fileDetails(params.fileId, sourceData);

  if (!file) {
    return json({ error: true, status: 404, message: `File not found` }, { status: 404 });
  }

  return json({
    status: 200,
    query: {
      sourceData
    },
    results: file
  });
}
