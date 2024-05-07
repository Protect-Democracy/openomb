import { deployedBaseUrl } from '$config';

export async function GET() {
  return new Response(
    `
Contact: mailto:security@openomb.org
Expires: 2027-01-01T05:00:00.000Z
Preferred-Languages: en
Canonical: ${deployedBaseUrl}/.well-known/security.txt
    `.trim(),
    {
      headers: {
        'Content-Type': 'text/plain'
      }
    }
  );
}
