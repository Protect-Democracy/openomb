/**
 * Tests for load-file.ts
 */

// Dependencies
import { expect, test, vi, afterEach } from 'vitest';
import { approvalDateFromPdfFileName, readPdfText } from './load-file';
import { DateTime } from 'luxon';
import path from 'node:path';
import fs from 'node:fs';

// Clear mocks after each
afterEach(() => {
  vi.clearAllMocks();
});

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

test('readPdfText() basic functionality', async () => {
  const testFilePath = path.resolve(
    __dirname,
    './test-data/FY2024_Department_of_Defense_Apportionment_2023-09-30.pdf'
  );
  const testBuffer = fs.readFileSync(testFilePath);
  const testArrayBuffer = testBuffer.buffer.slice(
    testBuffer.byteOffset,
    testBuffer.byteOffset + testBuffer.byteLength
  );

  // Mock the global fetch function
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(testArrayBuffer),
      // Optionally mock other methods if your code uses them (e.g., blob(), text(), json())
      blob: () => Promise.resolve(new Blob([testArrayBuffer], { type: 'application/pdf' })),
      headers: new Headers({ 'Content-Type': 'application/pdf' })
    })
  );

  const text = await readPdfText('http://example.com/mypdf.pdf');
  expect(text).toContain('Department of Defense');
});
