/**
 * Tests for load-file.ts
 */

// Dependencies
import { expect, test, vi, afterEach, describe, it, beforeEach } from 'vitest';
import { createIsolatedDb } from '../tests/helpers/db';
import { mockFetchResponse } from '../tests/helpers/fetch';
import { DateTime } from 'luxon';
import path from 'node:path';
import fs from 'node:fs';

import { fileDetails } from '../db/queries/files';

import {
  approvalDateFromPdfFileName,
  readPdfText,
  apportionmentListFromHomepage,
  loadJsonFile,
  isApportionmentPdfUrl,
  isSpendPlanPdfUrl
} from './load-file';

describe('approvalDateFromPdfFileName()', () => {
  it('should extract date from various filename formats', () => {
    const date1 = approvalDateFromPdfFileName(
      'https://apportionment-public.max.gov/Fiscal%20Year%202024/Department%20of%20Defense/PDF/FY2024_Department%20of%20Defense_Apportionment_2023-09-30.pdf'
    );
    expect(date1).toEqual(
      DateTime.fromISO('2023-09-30T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
    );

    const date2 = approvalDateFromPdfFileName(
      'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Agriculture/PDF/FY2025_Department%20of%20Agriculture_12.19.2024.pdf'
    );
    expect(date2).toEqual(
      DateTime.fromISO('2024-12-19T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
    );

    const date3 = approvalDateFromPdfFileName(
      'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Health%20and%20Human%20Services/PDF/FY2025_Department%20of%20Health%20and%20Human%20Services_Apportionment_2024_09_27.pdf'
    );
    expect(date3).toEqual(
      DateTime.fromISO('2024-09-27T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
    );

    const date4 = approvalDateFromPdfFileName(
      'https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20Defense--Military%20Programs/PDF/FY2026_Department_of_War_Apportionment_2025_11_13.pdf.pdf'
    );
    expect(date4).toEqual(
      DateTime.fromISO('2025-11-13T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
    );

    const date5 = approvalDateFromPdfFileName(
      'https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20War/PDF/FY2026_Department%20of%20War_Apportionment_2026-2-3.pdf.pdf.pdf'
    );
    expect(date5).toEqual(
      DateTime.fromISO('2026-02-03T12:00:00.000', { zone: 'America/New_York' }).toJSDate()
    );

    expect(approvalDateFromPdfFileName('20240501')).toEqual(null);
    expect(approvalDateFromPdfFileName('_20240501')).toEqual(null);

    expect(approvalDateFromPdfFileName('')).toEqual(null);
  });
});

describe('readPdfText()', () => {
  it('should read text from example PDF apportionment', async () => {
    const testFilePath = path.resolve(__dirname, './test-data/apportionment-pdf-test.pdf');
    const testBuffer = fs.readFileSync(testFilePath);
    const testArrayBuffer = testBuffer.buffer.slice(
      testBuffer.byteOffset,
      testBuffer.byteOffset + testBuffer.byteLength
    );

    // Mock response
    mockFetchResponse(
      testArrayBuffer,
      {
        headers: new Headers({ 'Content-Type': 'application/pdf' })
      },
      'arrayBuffer'
    );

    const text = await readPdfText('http://example.com/mypdf.pdf');
    expect(text).toContain('Department of Defense');
  });
});

describe('apportionmentListFromHomepage()', async () => {
  it('should read list of apportionment from homepage', async () => {
    const testHtmlPath = path.resolve(
      __dirname,
      './test-data/apportionment-homepage-test-data.html'
    );
    const testHtml = fs.readFileSync(testHtmlPath, 'utf-8');

    // Mock response
    mockFetchResponse(
      testHtml,
      {
        headers: new Headers({ 'Content-Type': 'text/html' })
      },
      'text'
    );

    const urls = await apportionmentListFromHomepage(
      'http://apportionmentListFromHomepage.testdomain/'
    );
    expect(urls.length).toBe(55768);
    // Find PDF URLs
    expect(urls.filter((url) => url.match(/\.pdf$/)).length).toBe(20);
    // Find JSON URLs
    expect(urls.filter((url) => url.match(/\.json$/)).length).toBe(27873);
  });
});

describe('loadJsonFile()', async () => {
  let dbSetup: Awaited<ReturnType<typeof createIsolatedDb>>;

  beforeEach(async () => {
    dbSetup = await createIsolatedDb();
  });

  afterEach(async () => {
    await dbSetup.teardown();
  });

  it('should handle http error silently', async () => {
    const url = 'http://example.com/404.json';

    // Mock response
    mockFetchResponse('Not Found', {
      ok: false,
      status: 404,
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    // Spy on console.error to check if the error is logged
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await loadJsonFile(url, 0);

    // Check if the error was logged
    expect(JSON.stringify(consoleErrorSpy.mock.calls[0])).toMatch(/LoadJsonFileError/);

    consoleErrorSpy.mockRestore();
  });

  test('handle footnote duplication', async () => {
    const testJsonPath = path.resolve(
      __dirname,
      './test-data/apportionment-footnote-duplicate-test.json'
    );
    const testJson = JSON.parse(fs.readFileSync(testJsonPath, 'utf-8'));
    const testUrl = 'http://example.com/data.json';

    // Mock response
    mockFetchResponse(testJson);

    const result = await loadJsonFile(testUrl, 0);

    if (!result) {
      throw new Error('Expected loadJsonFile to return a result, but got null');
    }

    // Get the details of the file
    const file = await fileDetails(result.fileId);

    if (!file) {
      throw new Error('Expected fileDetails to return a file, but got null');
    }

    // Basic file
    expect(result).toBeDefined();
    expect(result).toMatchObject({
      fileId: '11496188',
      fileName: 'FY2026_Agency=DOD_Bureau=O&M_TAFS=097-2025-2029-0100_Iteration=4_2026-01-28-15.14',
      fiscalYear: 2026,
      approvalTimestamp: new Date('2026-01-28T15:14:31.000Z'),
      folder: 'Department of Defense (Military Programs)',
      approverTitle: 'Program Associate Director for National Security Programs',
      fundsProvidedBy: 'Funds Provided by Public Law 119-21',
      folderId: 'department-of-defense-military-programs',
      approverTitleId: 'program-associate-director-for-national-security-programs',
      fundsProvidedByParsed: 'Public Law 119-21',
      excelUrl: null,
      pdfUrl: null,
      sourceUrl: 'http://example.com/data.json',
      sourceText: null,
      removed: false
    });

    // Tafs
    expect(file.tafs.length).toBe(1);
    expect(file.tafs[0]).toMatchObject({
      fileId: '11496188',
      tafsId: '097-0100-2025-2029',
      iteration: 4,
      fiscalYear: 2026,
      tafsTableId: '11496188--097-0100-2025-2029--4--2026',
      cgacAgency: '097',
      cgacAcct: '0100',
      allocationAgencyCode: null,
      allocationSubacct: null,
      beginPoa: 2025,
      endPoa: 2029,
      accountId: '097-0100',
      budgetAgencyTitle: 'Department of Defense (Military Programs)',
      budgetBureauTitle: 'Operation and Maintenance',
      accountTitle: 'Operation and Maintenance, Defense-wide',
      budgetAgencyTitleId: 'department-of-defense-military-programs',
      budgetBureauTitleId: 'operation-and-maintenance',
      accountTitleId: 'operation-and-maintenance-defense-wide',
      availabilityTypeCode: null,
      rptCat: false,
      adjAut: true,
      iterationDescription: 'Last Approved Apportionment: 2025-11-25',
      tafsIterationId: '12099052'
    });

    // Footnotes
    expect(file.footnotes.length).toBe(7);
    expect(file.footnotes.map((f) => f.footnoteNumber).toSorted()).toEqual(
      ['A1', 'A2', 'B1', 'B2', 'B3', 'B4', 'B5'].toSorted()
    );

    // Lines
    expect(file.tafs[0].lines.length).toBe(9);
    // @ts-ignore
    const lineSorter = (a, b) => a.lineIndex - b.lineIndex;
    const expectedLines = [
      {
        tafsTableId: '11496188--097-0100-2025-2029--4--2026',
        lineIndex: 4,
        lineNumber: '1000',
        lineSplit: 'MA1',
        lineDescription: 'Mandatory Actual Unob Bal-Direct: Brought forward, October 1',
        approvedAmount: 1782873000,
        fileId: '11496188',
        lineTypeId: 'budgetary-resources'
      },
      {
        tafsTableId: '11496188--097-0100-2025-2029--4--2026',
        lineIndex: 3,
        lineNumber: '1000',
        lineSplit: 'ME1',
        lineDescription: 'Mandatory Estimated Unob Bal-Direct: Brought forward, October 1',
        approvedAmount: null,
        fileId: '11496188',
        lineTypeId: 'budgetary-resources'
      },
      {
        tafsTableId: '11496188--097-0100-2025-2029--4--2026',
        lineIndex: 6,
        lineNumber: '1020',
        lineSplit: null,
        lineDescription: 'Unob Bal: Adj to SOY bal brought forward, Oct 1',
        approvedAmount: 174000000,
        fileId: '11496188',
        lineTypeId: 'budgetary-resources'
      },
      {
        tafsTableId: '11496188--097-0100-2025-2029--4--2026',
        lineIndex: 7,
        lineNumber: '1920',
        lineSplit: null,
        lineDescription: 'Total budgetary resources avail (disc. and mand.)',
        approvedAmount: 1956873000,
        fileId: '11496188',
        lineTypeId: 'budgetary-resources'
      },
      {
        tafsTableId: '11496188--097-0100-2025-2029--4--2026',
        lineIndex: 8,
        lineNumber: '6011',
        lineSplit: null,
        lineDescription: 'Lump Sum',
        approvedAmount: 1606598000,
        fileId: '11496188',
        lineTypeId: 'budgetary-resources-application'
      },
      {
        tafsTableId: '11496188--097-0100-2025-2029--4--2026',
        lineIndex: 9,
        lineNumber: '6170',
        lineSplit: null,
        lineDescription: 'Apportioned in FY 2027',
        approvedAmount: 350275000,
        fileId: '11496188',
        lineTypeId: 'budgetary-resources-application'
      },
      {
        tafsTableId: '11496188--097-0100-2025-2029--4--2026',
        lineIndex: 5,
        lineNumber: '6171',
        lineSplit: null,
        lineDescription: 'Apportioned in FY 2028',
        approvedAmount: null,
        fileId: '11496188',
        lineTypeId: 'budgetary-resources-application'
      },
      {
        tafsTableId: '11496188--097-0100-2025-2029--4--2026',
        lineIndex: 10,
        lineNumber: '6172',
        lineSplit: null,
        lineDescription: 'Apportioned in FY 2029',
        approvedAmount: null,
        fileId: '11496188',
        lineTypeId: 'budgetary-resources-application'
      },
      {
        tafsTableId: '11496188--097-0100-2025-2029--4--2026',
        lineIndex: 11,
        lineNumber: '6190',
        lineSplit: null,
        lineDescription: 'Total budgetary resources available',
        approvedAmount: 1956873000,
        fileId: '11496188',
        lineTypeId: 'budgetary-resources-application'
      }
    ].toSorted(lineSorter);
    file.tafs[0].lines.toSorted(lineSorter).forEach((line, index) => {
      expect(line).toMatchObject(expectedLines[index]);
    });

    // This one has a duplicate footnote number in it.
    const lineToTest = file.tafs[0].lines.find((line) => line.lineIndex === 7);
    expect(lineToTest?.footnotes.length).toBe(3);
    expect(lineToTest?.footnotes.map((f) => f.footnoteNumber).toSorted()).toEqual(
      ['B2', 'B3', 'B5'].toSorted()
    );
  });
});

describe('isApportionmentPdfUrl()', () => {
  it('should identify apportionment PDF URLs', () => {
    const validUrls = [
      'https://apportionment-public.max.gov/Fiscal%20Year%202024/Department%20of%20Defense/PDF/FY2024_Department%20of%20Defense_Apportionment_2023-09-30.pdf',
      'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Agriculture/PDF/FY2025_Department%20of%20Agriculture_12.19.2024.pdf',
      'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Health%20and%20Human%20Services/PDF/FY2025_Department%20of%20Health%20and%20Human%20Services_Apportionment_2024_09_27.pdf',
      'https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20Defense--Military%20Programs/PDF/FY2026_Department_of_War_Apportionment_2025_11_13.pdf.pdf',
      'https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20War/PDF/FY2026_Department%20of%20War_Apportionment_2026-2-3.pdf.pdf.pdf'
    ];
    validUrls.forEach((url) => {
      expect(isApportionmentPdfUrl(url)).toBe(true);
    });

    const invalidUrls = [
      'https://apportionment-public.max.gov/Spend Plans/FY 2025 CNCS Spend Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20DHS%20FLETC%20OS%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20AHRQ%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20CDC%20Chronic%20Diseases%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20CDC%20Injury%20Prevention%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20CDC%20PHPR%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20GDM%20TPP%20Evaluation%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20HRSA%20Operating%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20SAMHSA%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202026%20DHS%20FLETC%20PCI%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202026%20VA%20RETF%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/PY%202023%20DOL%20OJC%20CRA%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/PY%202024%20DOL%20OJC%20CRA%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/PY%202025%20DOL%20OJC%20CRA%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/PY%202025%20DOL%20OJC%20Operations%20Spend%20Plan.pdf'
    ];
    invalidUrls.forEach((url) => {
      console.log('Testing URL:', url);
      expect(isApportionmentPdfUrl(url)).toBe(false);
    });
  });
});

describe('isSpendPlanPdfUrl()', () => {
  it('should identify spend plan PDF URLs', () => {
    const invalidUrls = [
      'https://apportionment-public.max.gov/Fiscal%20Year%202024/Department%20of%20Defense/PDF/FY2024_Department%20of%20Defense_Apportionment_2023-09-30.pdf',
      'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Agriculture/PDF/FY2025_Department%20of%20Agriculture_12.19.2024.pdf',
      'https://apportionment-public.max.gov/Fiscal%20Year%202025/Department%20of%20Health%20and%20Human%20Services/PDF/FY2025_Department%20of%20Health%20and%20Human%20Services_Apportionment_2024_09_27.pdf',
      'https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20Defense--Military%20Programs/PDF/FY2026_Department_of_War_Apportionment_2025_11_13.pdf.pdf',
      'https://apportionment-public.max.gov/Fiscal%20Year%202026/Department%20of%20War/PDF/FY2026_Department%20of%20War_Apportionment_2026-2-3.pdf.pdf.pdf'
    ];
    invalidUrls.forEach((url) => {
      expect(isSpendPlanPdfUrl(url)).toBe(false);
    });

    const validUrls = [
      'https://apportionment-public.max.gov/Spend Plans/FY 2025 CNCS Spend Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20DHS%20FLETC%20OS%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20AHRQ%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20CDC%20Chronic%20Diseases%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20CDC%20Injury%20Prevention%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20CDC%20PHPR%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20GDM%20TPP%20Evaluation%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20HRSA%20Operating%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202025%20HHS%20SAMHSA%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202026%20DHS%20FLETC%20PCI%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/FY%202026%20VA%20RETF%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/PY%202023%20DOL%20OJC%20CRA%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/PY%202024%20DOL%20OJC%20CRA%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/PY%202025%20DOL%20OJC%20CRA%20Spend%20Plan.pdf',
      'https://apportionment-public.max.gov/Spend%20Plans/PY%202025%20DOL%20OJC%20Operations%20Spend%20Plan.pdf'
    ];
    validUrls.forEach((url) => {
      console.log('Testing URL:', url);
      expect(isSpendPlanPdfUrl(url)).toBe(true);
    });
  });
});
