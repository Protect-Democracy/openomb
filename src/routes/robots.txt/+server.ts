import { deployedBaseUrl } from '$config';

export async function GET() {
  return new Response(
    `
User-agent: *

Disallow: /examples
Disallow: /styles
Disallow: /subscribe
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
