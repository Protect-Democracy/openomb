import { deployedBaseUrl } from '$config';
import { mBureaus } from '$queries/agencies';

export async function GET() {
  const bureauRecords = (await mBureaus('approval')) || [];

  const urls = bureauRecords.map((b) => {
    return `
    <url>
      <loc>${deployedBaseUrl}/agency/${b.budgetAgencyTitleId}/bureau/${b.budgetBureauTitleId}</loc>
    </url>
    `.trim();
  });

  return new Response(
    `
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="https://www.w3.org/1999/xhtml"
			xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
			xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
			xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
			xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
		>
      ${urls.join('\n')}
		</urlset>`.trim(),
    {
      headers: {
        'Content-Type': 'application/xml'
      }
    }
  );
}
