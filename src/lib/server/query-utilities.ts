import type { filesSelect } from '$schema/files';

type FileType = filesSelect['fileType'];

/**
 * A count of files of one type, grouped by folder and/or agency/bureau.
 */
type FileTypeCountRecord = Partial<
  Pick<filesSelect, 'folderId' | 'budgetAgencyTitleId' | 'budgetBureauTitleId'>
> & {
  fileType: FileType;
  fileCount: number;
};

/**
 * File counts keyed by file type, e.g. `{ standard: 3, 'spend-plan': 1 }`.
 */
export type FileTypeCounts = Partial<Record<FileType, number>>;

/**
 * A grouped record with its total file count and counts by file type.
 */
export type FileTypeCountResult<TRecord extends FileTypeCountRecord> = Omit<
  TRecord,
  'fileType' | 'fileCount'
> &
  FileTypeCounts & { fileCount: number };

/**
 * Aggregate our records and append our counts by file type
 *
 */
export function reduceByFileType<TRecord extends FileTypeCountRecord>(
  records: TRecord[]
): FileTypeCountResult<TRecord>[] {
  // Keep insertion order so results match the order of the incoming records
  const merged = new Map<string, FileTypeCountResult<TRecord>>();

  for (const record of records) {
    // Null and undefined are treated the same when grouping
    const key = JSON.stringify([
      record.folderId ?? null,
      record.budgetAgencyTitleId ?? null,
      record.budgetBureauTitleId ?? null
    ]);
    const { fileType, fileCount, ...groupFields } = record;
    const counts: FileTypeCounts = { [fileType]: fileCount };
    const prevRecord = merged.get(key);

    merged.set(
      key,
      prevRecord
        ? { ...prevRecord, ...counts, fileCount: prevRecord.fileCount + fileCount }
        : { ...groupFields, ...counts, fileCount }
    );
  }

  return [...merged.values()];
}

/**
 * Escape LIKE/ILIKE pattern metacharacters so user input is matched literally.
 * Postgres uses backslash as the default LIKE escape character.
 *
 * @param value - Raw user input to embed in a LIKE pattern.
 * @returns The input with `\`, `%`, and `_` escaped.
 *
 * @example
 * ilike(column, `%${escapeLike('100%')}%`); // matches "100%" literally
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
