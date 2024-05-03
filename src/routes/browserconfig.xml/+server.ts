// Dependencies
import favMstile from '$assets/favicon/mstile-150x150.png';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  return new Response(
    `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="${favMstile}"/>
            <TileColor>#ffc40d</TileColor>
        </tile>
    </msapplication>
</browserconfig>`,
    {
      headers: {
        'Content-Type': 'application/xml'
      }
    }
  );
}
