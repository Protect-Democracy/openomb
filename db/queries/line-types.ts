/**
 * Line types queries.
 */

// Dependencies
import { eq, gte, lte, and } from 'drizzle-orm';
import { isInteger } from 'lodash-es';
import { lineTypes } from '../schema/line-types';
import { db } from '../connection';
import defaultLineTypes from '../../data/line-types';
import { memoizeDataAsync } from '../../server/cache';

// Types
import type { lineTypesSelect } from '../schema/line-types';

/**
 * Load default file types if there is nothing in the table already.
 *
 * @returns
 */
export const loadDefaultLineTypes = async () => {
  // Check if there are any line types
  const existingLineTypes = await db.query.lineTypes.findMany();
  if (existingLineTypes?.length > 0) {
    return;
  }

  // Load the default line types
  for (const defaultLineType of defaultLineTypes) {
    const lineTypeRecord = {
      ...defaultLineType,
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    // Upsert file
    await db
      .insert(lineTypes)
      .values(lineTypeRecord)
      .onConflictDoUpdate({
        target: lineTypes.lineTypeId,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set: (({ createdAt, ...o }) => o)(lineTypeRecord)
      })
      .returning();
  }

  return;
};

/**
 * Compute line type from a schedule line record.
 *
 * @param linesRecord
 * @returns The computed line type
 */
export const lineTypeFromLineNumber = async (
  lineNumber: string | number
): Promise<lineTypesSelect | null> => {
  // Get line number as a number
  const lineNumberInt = parseInt(lineNumber.toString(), 10);

  // Find line type from the range
  if (isInteger(lineNumberInt) && lineNumberInt >= 0) {
    const foundLineType = await db
      .select()
      .from(lineTypes)
      .where(
        and(lte(lineTypes.upperLimit, lineNumberInt), gte(lineTypes.lowerLimit, lineNumberInt))
      );
    if (foundLineType?.length > 0) {
      return foundLineType[0];
    }
  }

  // Otherwise, return other
  const otherLineType = await db.select().from(lineTypes).where(eq(lineTypes.lineTypeId, 'other'));
  return otherLineType?.[0] || null;
};

// Memoize
export const mLineTypeFromLineNumber = memoizeDataAsync(lineTypeFromLineNumber);
