import { deployedBaseUrl } from '$config';

export async function GET() {
  return new Response(
    `
		<?xml version="1.0" encoding="UTF-8" ?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap>
        <loc>${deployedBaseUrl}/sitemaps/base.xml</loc>
      </sitemap>
      <sitemap>
        <loc>${deployedBaseUrl}/sitemaps/files.xml</loc>
      </sitemap>
      <sitemap>
        <loc>${deployedBaseUrl}/sitemaps/folders.xml</loc>
      </sitemap>
      <sitemap>
        <loc>${deployedBaseUrl}/sitemaps/agencies.xml</loc>
      </sitemap>
      <sitemap>
        <loc>${deployedBaseUrl}/sitemaps/bureaus.xml</loc>
      </sitemap>
      <sitemap>
        <loc>${deployedBaseUrl}/sitemaps/accounts.xml</loc>
      </sitemap>
		</sitemapindex>`.trim(),
    {
      headers: {
        'Content-Type': 'application/xml'
      }
    }
  );
}
