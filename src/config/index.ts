/**
 * Config for the application that are valid on both server and client.
 */

import horizontalSocialImage from '$assets/social/OpenOMB-Share-Horiz.png';
//import squareSocialImage from '$assets/social/OpenOMB-Share-Squarish.png';

export const deployedBaseUrl = 'https://openomb.org';
export const isBeta = true;
export const siteName = 'OpenOMB';
export const siteAuthor = 'Protect Democracy';
export const siteDescription = `OpenOMB is the easiest way to find and track apportionments. Apportionments are legally binding plans issued by the White House Office of Management and Budget that set the pace at which federal agencies may spend appropriated funds. OpenOMB's database makes apportionments easy to find and track.`;
export const siteKeywords = [
  'OMB',
  'apportionments',
  'Office of Management and Budget',
  'budget',
  'budget execution',
  'federal budget',
  'presidential spending decision'
];
export const contactEmail = 'contact@openomb.org';
export const supportEmail = 'support@openomb.org';
export const collectionHour = 2;
export const collectionMinute = 0;
export const collectionTimezone = 'America/New_York';
export const cacheRevalidateSeconds = 60 * 3;
export const socialOgImgPath = horizontalSocialImage;
export const socialOgImgWidth = 940;
export const socialOgImgHeight = 788;
export const socialTwitterCard = 'summary_large_image';
export const socialTwitterSite = '@protctdemocracy';
export const socialTwitterCreator = '@protctdemocracy';
export const socialTwitterImgPath = horizontalSocialImage;
export const googleAnalyticsId = 'G-Y5NJ2S21X5';
export const securityHeaders = {
  // Security headers
  // Note: CSP headers are configured in `svelte.config.js`
  'Expect-CT': 'enforce, max-age=3600',
  'Referrer-Policy': 'strict-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block'
};
