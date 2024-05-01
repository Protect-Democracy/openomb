/**
 * Config for the application that are valid on both server and client.
 */

export const deployedBaseUrl = 'https://apportionments.protectdemocracy.org';
export const siteName = 'OpenOMB';
export const siteAuthor = 'Protect Democracy';
export const siteDescription = `${siteName} allows for easier searching and navigation of apportionments
  published by the Office of Management and Budget`;
export const siteKeywords = ['OMB', 'Apportionments', 'Office of Management and Budget'];
export const cacheHeadersHour = 5;
export const cacheHeadersMinute = 0;
export const collectionTimezone = 'America/New_York';
export const socialOgImgPath = '/og.png';
export const socialOgImgWidth = 1200;
export const socialOgImgHeight = 630;
export const socialTwitterCard = 'summary_large_image';
export const socialTwitterSite = '@protctdemocracy';
export const socialTwitterCreator = '@protctdemocracy';
export const socialTwitterImgPath = '/twitter.png';
export const securityHeaders = {
  // Security headers
  // TODO: Add report-uri to Sentry
  // See: https://docs.sentry.io/product/security-policy-reporting/#expect-ct
  //
  // Note: CSP headers are configured in `svelte.config.js`
  'Expect-CT': 'enforce, max-age=3600',
  'Referrer-Policy': 'strict-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block'
};
