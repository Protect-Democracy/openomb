/** @type {import('./$types').PageLoad} */
export async function load({ setHeaders }) {
  // Common headers.
  //
  // Note: These only apply to code routes and not assets or static files.
  // Though it does look like the default headers for assets are reasonable.
  // On the other hand, static files don't look to have any cache headers
  // which is not great.
  //
  // Note: These specific headers cannot be set again otherwise an error
  // will be thrown.
  //
  // Note: CSP headers are configured in `svelte.config.js`
  setHeaders({
    // TODO: Add report-uri to Sentry
    // See: https://docs.sentry.io/product/security-policy-reporting/#expect-ct
    'Expect-CT': 'enforce, max-age=3600',
    'Referrer-Policy': 'strict-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block'
  });
}
