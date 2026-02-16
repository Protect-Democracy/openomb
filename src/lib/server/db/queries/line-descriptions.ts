/**
 * Query functions for line descriptions.
 */

// Dependencies
import { lineDescriptions } from '../schema/line-descriptions';
import type { lineDescriptionsSelect } from '../schema/line-descriptions';
import { db } from '../connection';
import { mLineTypeFromLineNumber } from './line-types';
import { memoizeDataAsync } from '../../../../../server/cache';
import defaultLineDescriptions from '../../../../../data/line-descriptions';

// Types
type lineDescriptionCsvRecord = {
  Lines: string;
  Description: string;
};

/**
 * Load default line descriptions from CSV file
 */
export const loadDefaultLineDescriptions = async (): Promise<void> => {
  const records: lineDescriptionCsvRecord[] = defaultLineDescriptions;

  // Insert records if they don't exist
  if (records?.length > 0) {
    // Transform data to match schema
    //
    // Example:
    // Lines,Description
    // 1000,"Act. Unob Bal: Brought forward, October 1"
    // 1010,Actual - Unob Bal: Transferred to other accounts
    // 6011-6110,Category B: Amounts requested on a basis other than calendar quarters
    const parsedRecords: Array<lineDescriptionsSelect> = [];
    for (const record of records) {
      // Check for multiple lines
      const isRange = !!record.Lines.match(/[0-9]*-[0-9]*/);
      const isSingle = !!record.Lines.match(/[0-9]*/);
      if (isRange) {
        const [start, end] = record.Lines.split('-');
        for (let i = parseInt(start, 10); i <= parseInt(end, 10); i++) {
          parsedRecords.push({
            lineNumber: i.toString(),
            description: record.Description,
            lineTypeId: (await mLineTypeFromLineNumber(i.toString()))?.lineTypeId || 'other',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      else if (isSingle) {
        parsedRecords.push({
          lineNumber: record.Lines,
          description: record.Description,
          lineTypeId: (await mLineTypeFromLineNumber(record.Lines))?.lineTypeId || 'other',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      else {
        throw new Error(`Invalid line number: ${record.Lines}`);
      }
    }

    // Upsert records
    for (const parsedRecord of parsedRecords) {
      await db
        .insert(lineDescriptions)
        .values(parsedRecord)
        .onConflictDoUpdate({
          target: lineDescriptions.lineNumber,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          set: (({ createdAt, ...o }) => o)(parsedRecord)
        })
        .returning();
    }
  }

  return;
};

/**
 * Get all line descriptions and include types.
 */
export const allLineDescriptions = async (): Promise<Array<lineDescriptionsSelect> | null> => {
  return db.query.lineDescriptions.findMany({
    with: {
      lineType: true
    }
  });
};

// Memoized version
export const mAllLineDescriptions = memoizeDataAsync(allLineDescriptions);
