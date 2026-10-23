import { files } from '$schema/files';
import { tafs } from '$schema/tafs';
import { db } from '$db/connection';

import type { filesInsert } from '$schema/files';
import type { tafsInsert } from '$schema/tafs';

/**
 * Create an apportionment in the database with fake data for testing.
 */
export async function createApportionment(
  fileData: Partial<filesInsert> = {},
  tafsData: Partial<tafsInsert>[] = [],
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

  // TAFS rows require a fiscal year, which only comes from the file
  const fiscalYear = file.fiscalYear;
  if (fiscalYear == null) {
    throw new Error('Test apportionment file must have a fiscal year to create TAFS rows.');
  }

  // Determine number of tafs
  const numTafs = tafsData.length || Math.floor(Math.random() * 3) + 1;
  const savedTafs = [];
  for (let i = 0; i < numTafs; i++) {
    const tafsRecord = {
      fileId: file.fileId,
      tafsId: `123-1234-1-${fiscalYear}-${i}-${fileId}`,
      iteration: 1,
      fiscalYear: fiscalYear,
      tafsTableId: `123-1234-1-${fiscalYear}-${i}-${fileId}-1`,
      cgacAgency: `123`,
      cgacAcct: `1234`,
      allocationAgencyCode: `1`,
      allocationSubacct: ``,
      beginPoa: fiscalYear,
      endPoa: fiscalYear,
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
