import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { lines } from '$schema/lines';
import { footnotes } from '$schema/footnotes';
import { db } from '$db/connection';

import type { filesInsert } from '$schema/files';
import type { tafsInsert } from '$schema/tafs';
import type { linesInsert } from '$schema/lines';
import type { footnotesInsert } from '$schema/footnotes';

/**
 * Create an apportionment in the database with fake data for testing.
 */
export async function createApportionment(
  fileData: Partial<filesInsert> = {},
  tafsData: Partial<tafsInsert>[] = [],
  linesData: Partial<linesInsert>[] = [],
  footnotesData: Partial<footnotesInsert>[] = [],
  dbInstance = db
) {
  dbInstance = dbInstance || db;

  const fileId = crypto.randomUUID();
  const result = await dbInstance
    .insert(files)
    .values({
      fileId: `test-apportionment-${fileId}`,
      fileName: `test_apportionment-${fileId}.json`,
      fiscalYear: 2024,
      approvalTimestamp: new Date(),
      folder: 'Test Folder',
      approverTitle: 'Test Approver',
      fundsProvidedBy: 'Test Funds Source',
      folderId: 'test-folder',
      approverTitleId: 'test-approver',
      fundsProvidedByParsed: 'Tests Funds Source Parsed',
      excelUrl: `https://example.com/test_apportionment-${fileId}.xlsx`,
      sourceUrl: `https://example.com/test_apportionment-${fileId}.json`,
      sourceData: 'Test source data',
      ...fileData
    })
    .returning();
  const file = result[0];

  // Determine number of tafs
  const numTafs = tafsData.length || Math.floor(Math.random() * 3) + 1;
  const savedTafs = [];
  for (let i = 0; i < numTafs; i++) {
    const tafsRecord = {
      fileId: file.fileId,
      tafsId: `123-1234-1-${file.fiscalYear}-${i}-${fileId}`,
      iteration: 1,
      fiscalYear: file.fiscalYear,
      tafsTableId: `123-1234-1-${file.fiscalYear}-${i}-${fileId}-1`,
      cgacAgency: `123`,
      cgacAcct: `1234`,
      allocationAgencyCode: `1`,
      allocationSubacct: ``,
      beginPoa: file.fiscalYear,
      endPoa: file.fiscalYear,
      accountId: `123-1234-1`,
      budgetAgencyTitle: `Test Budget Agency Title`,
      budgetBureauTitle: `Test Budget Bureau Title`,
      accountTitle: `Test Account Title`,
      budgetAgencyTitleId: `test-budget-agency`,
      budgetBureauTitleId: `test-budget-bureau`,
      accountTitleId: `test-account-title`,
      availabilityTypeCode: true,
      rptCat: false,
      adjAut: false,
      iterationDescription: `Test Iteration Description ${i}`,
      tafsIterationId: `test-tafs-iteration-id-${crypto.randomUUID()}`,
      ...(tafsData[i] || {})
    };
    const savedTaf = await dbInstance.insert(tafs).values(tafsRecord).returning();
    savedTafs.push(savedTaf[0]);
  }

  return file;
}
