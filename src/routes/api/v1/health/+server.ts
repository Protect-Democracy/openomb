// Dependencies
import { apiResponse } from '$lib/api';

/**
 * Health endpoint
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  // TODO: Do we want to test the database connection here?  Or maybe
  // a separate API endpoint for that?
  // await dbConnect();

  return apiResponse({
    query: {},
    results: {
      health: 'ok'
    }
  });
}
