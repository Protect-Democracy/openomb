// Dependencies
import { json } from '@sveltejs/kit';

/**
 * Health endpoint
 */
/** @type {import('./$types').RequestHandler} */
export async function GET() {
  // See /api/v1/info for more details

  return json({
    query: {},
    results: {
      health: 'ok'
    }
  });
}
