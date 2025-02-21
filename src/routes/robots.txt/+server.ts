import { deployedBaseUrl } from '$config';

export async function GET() {
  return new Response(
    `
User-agent: *

Disallow: /examples
Disallow: /styles
Disallow: /subscribe

Sitemap: ${deployedBaseUrl}/sitemap.xml
    `.trim(),
    {
      headers: {
        'Content-Type': 'text/plain'
      }
    }
  );
}
