import type { filesInsert } from '$schema/files';
import type { spendPlansInsert } from '$schema/spend-plans';

/**
 * Fixes for PDF files.
 */

// ID should be source URL
const pdfFixes: Record<string, Partial<filesInsert | spendPlansInsert>> = {
  'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Health%20and%20Human%20Services/PDF/FY2025_Department%20of%20Health%20and%20Human%20Services_Letter%20Apportionment_2025-09-30.pdf':
    {
      // This file has a typo in the URL where the approval date is set to the wrong year.
      // Inserts date as approved at noon in America/New_York timezone (no DST)
      approvalTimestamp: new Date('2024-09-30T12:00:00-05:00')
    },
  'https://apportionment-public.max.gov/Fiscal%20Year%202025/Multiple%20Agencies/PDF/FY2025%20Department%20of%20State%20and%20International%20Assistance%20Programs%20letter%20apportionment.pdf.pdf':
    {
      // This file has no approval date provided in the url
      // Inserts date as approved at noon in America/New_York timezone (no DST)
      approvalTimestamp: new Date('2025-08-29T12:00:00-05:00')
    }
};

export default pdfFixes;
