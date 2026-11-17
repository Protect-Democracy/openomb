import { deployedBaseUrl } from '$config';

// `/search` is disallowed because crawlers (Perplexity, Bing, Google) were paging through
// search results (e.g. `?term=&page=313`), and every page runs expensive full-table queries.
// Search results duplicate the agency, bureau, account, and file pages, which crawlers can
// still reach through the sitemaps.
export async function GET() {
  return new Response(
    `
User-agent: *

Disallow: /examples
Disallow: /styles
Disallow: /subscribe
Disallow: /search
Disallow: /api/v1/user

Sitemap: ${deployedBaseUrl}/sitemap.xml
    `.trim(),
    {
      headers: {
        'Content-Type': 'text/plain'
      }
    }
  );
}
