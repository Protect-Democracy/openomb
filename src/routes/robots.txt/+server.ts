import { deployedBaseUrl } from '$config';

export async function GET() {
  return new Response(
    `
User-agent: *
Disallow: /

Sitemap: ${deployedBaseUrl}/sitemap.xml
    `.trim(),
    {
      headers: {
        'Content-Type': 'text/plain'
      }
    }
  );
}
