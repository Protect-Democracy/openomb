import { json } from '@sveltejs/kit';
import { sourceDataUrl } from '$config';

/**
 * Proxy PDF's from OMB for local iframe embedding.
 *
 * Note that (in Chrome) the PDF iframe preview uses the URL
 * filename as the title of the display, hence why we name this
 * endpoint this way.  It may be better to do a catch-all so
 * it could be the same name as the file that is needed.
 *
 * Example: https://apportionment-public.max.gov/Fiscal%20Year%202024/Department%20of%20Defense/PDF/FY2024_Department%20of%20Defense_Apportionment_2023-09-30.pdf
 */
/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  // Any query parameters
  const urlToProxy = url.searchParams.get('url') || '';

  // Check that we have a URL
  if (!urlToProxy) {
    return json({ error: true, status: 400, message: `Missing URL` }, { status: 400 });
  }

  // Parse URL and make sure that the domain is from OMB
  let urlObj;
  try {
    urlObj = new URL(urlToProxy);
  } catch (error) {
    return json({ error: true, status: 400, message: error.toString() }, { status: 400 });
  }

  if (urlObj.hostname !== new URL(sourceDataUrl).hostname) {
    return json({ error: true, status: 400, message: `Invalid URL` }, { status: 400 });
  }

  // Get file name from URL
  const pathParts = urlObj.pathname.split('/');
  const fileName = pathParts[pathParts.length - 1];

  // Fetch the file
  const response = await fetch(urlToProxy);
  const blob = await response.blob();

  // TODO: Handle different file types, such as Excel
  return new Response(blob, {
    headers: {
      'Content-type': 'application/pdf',
      'Content-Disposition': `inline; filename=${fileName}`
    }
  });
}
