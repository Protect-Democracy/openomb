/**
 * Fixes for PDF files.
 */

// ID should be source URL
const pdfFixes = {
  'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Health%20and%20Human%20Services/PDF/FY2025_Department%20of%20Health%20and%20Human%20Services_Letter%20Apportionment_2025-09-30.pdf':
    {
      // This file has a typo in the URL where the approval date is set to the wrong year.
      approvalTimestamp: new Date('2024-09-30')
    }
};

export default pdfFixes;
