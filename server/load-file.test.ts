/**
 * Tests for load-file.ts
 */

// Dependencies
import { expect, test } from 'vitest';
import { approvalDateFromPdfFileName } from './load-file';
import { DateTime } from 'luxon';

test('approvalDateFromPdfFileName()', () => {
  const date1 = approvalDateFromPdfFileName(
    'https://apportionment-public.max.gov/Fiscal%20Year%202024/Department%20of%20Defense/PDF/FY2024_Department%20of%20Defense_Apportionment_2023-09-30.pdf'.replace(
      '.pdf',
      ''
    )
  );
  expect(date1).toEqual(
    DateTime.fromISO('2023-09-30T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
  );

  const date2 = approvalDateFromPdfFileName(
    'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Agriculture/PDF/FY2025_Department%20of%20Agriculture_12.19.2024.pdf'.replace(
      '.pdf',
      ''
    )
  );
  expect(date2).toEqual(
    DateTime.fromISO('2024-12-19T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
  );

  const date3 = approvalDateFromPdfFileName(
    'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Health%20and%20Human%20Services/PDF/FY2025_Department%20of%20Health%20and%20Human%20Services_Apportionment_2024_09_27.pdf'.replace(
      '.pdf',
      ''
    )
  );
  expect(date3).toEqual(
    DateTime.fromISO('2024-09-27T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
  );

  const date4 = approvalDateFromPdfFileName(
    'https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20Defense--Military%20Programs/PDF/FY2026_Department_of_War_Apportionment_2025_11_13.pdf.pdf'.replace(
      /(\.pdf)+$/,
      ''
    )
  );
  expect(date4).toEqual(
    DateTime.fromISO('2025-11-13T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
  );

  expect(approvalDateFromPdfFileName('_12.19.2024')).toEqual(
    DateTime.fromISO('2024-12-19T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
  );

  expect(approvalDateFromPdfFileName('20240501')).toEqual(null);
  expect(approvalDateFromPdfFileName('_20240501')).toEqual(null);

  expect(approvalDateFromPdfFileName('')).toEqual(null);
});
