import { omit } from 'lodash-es';
import type { filesSelect } from '$schema/files';

/**
 * Aggregate our records and append our counts by file type
 *
 */
export function reduceByFileType(
  records: Array<
    Partial<filesSelect> & {
      fileCount: number;
    }
  >
): Array<
  Record<string, number> &
    Partial<filesSelect> & {
      fileCount: number;
    }
> {
  return records.reduce(
    (accum, record) => {
      const prevRecord = accum.find(
        (r) =>
          r.folderId == record.folderId &&
          r.budgetAgencyTitleId == record.budgetAgencyTitleId &&
          r.budgetBureauTitleId == record.budgetBureauTitleId
      );
      if (prevRecord) {
        prevRecord[`${record.fileType}`] = record.fileCount;
        (prevRecord.fileCount as number) += record.fileCount;
        return accum;
      }
      else {
        return [
          ...accum,
          {
            ...omit(record, 'fileType'),
            [`${record.fileType}`]: record.fileCount,
            fileCount: record.fileCount
          }
        ];
      }
    },
    [] as ReturnType<typeof reduceByFileType>
  );
}
