// Dependencies
import { json } from 'stream/consumers';
import { siteName } from '$config';
import favAndroid192 from '$assets/favicon/android-chrome-192x192.png';
import favAndroid512 from '$assets/favicon/android-chrome-512x512.png';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  return json({
    name: siteName,
    short_name: siteName,
    icons: [
      {
        src: favAndroid192,
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: favAndroid512,
        sizes: '512x512',
        type: 'image/png'
      }
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone'
  });
}
