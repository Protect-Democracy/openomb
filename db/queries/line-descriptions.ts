/**
 * Query functions for line descriptions.
 */

// Dependencies
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { lineDescriptions } from '../schema/line-descriptions';
import type { lineDescriptionsSelect } from '../schema/line-descriptions';
import { db } from '../connection';
import { mLineTypeFromLineNumber } from './line-types';
import { memoizeDataAsync } from '../../server/cache';

// Types
type lineDescriptionCsvRecord = {
  Lines: string;
  Description: string;
};

// Directory (note that __dirname might actually be available globally)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to data
const lineDescriptionsFilePath = resolvePath(__dirname, '../../data/line-descriptions.csv');

/**
 * Load default line descriptions from CSV file
 */
export const loadDefaultLineDescriptions = async (): Promise<void> => {
  // Read CSV file
  const csvContent = readFileSync(lineDescriptionsFilePath, 'utf-8');

  // Parse CSV content
  const records: Array<lineDescriptionCsvRecord> = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  // Insert records if they don't exist
  if (records?.length > 0) {
    // Transform data to match schema
    //
    // Example:
    // Lines,Description
    // 1000,"Act. Unob Bal: Brought forward, October 1"
    // 1010,Actual - Unob Bal: Transferred to other accounts
    const parsedRecords: Array<lineDescriptionsSelect> = [];
    for (const record of records) {
      parsedRecords.push({
        lineNumber: record.Lines,
        description: record.Description,
        lineTypeId: (await mLineTypeFromLineNumber(record.Lines))?.lineTypeId || 'other',
        createdAt: new Date(),
        updatedAt: new Date()
      });
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
