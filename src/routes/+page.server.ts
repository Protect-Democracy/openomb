import { db } from '$db/connection';
import { file } from '$schema/files';
import { schedule } from '$schema/schedules';
import { desc, eq, countDistinct, count } from 'drizzle-orm';
import { groupBy, map as _map } from 'lodash-es';
import type { PageServerData } from './$types';

export const load: PageServerData = async () => {
  return {
    recentFiles: await db.select().from(file).orderBy(desc(file.approvalTimestamp)).limit(20),
    recentRemoved: await db
      .select()
      .from(file)
      .where(eq(file.removed, true))
      .orderBy(desc(file.modifiedAt))
      .limit(10),
    folders: await db
      .select({ folder: file.folder, count: count(file.fileId) })
      .from(file)
      .groupBy(file.folder)
      .orderBy(file.folder),
    approvers: await db
      .select({ approver: file.approverTitle, count: count(file.fileId) })
      .from(file)
      .groupBy(file.approverTitle)
      .orderBy(file.approverTitle),
    departmentAgencyBureau: groupDepartmentAgencyBureau(
      await db
        .select({
          folder: file.folder,
          agency: schedule.budgetAgencyTitle,
          bureau: schedule.budgetBureauTitle,
          fileCount: countDistinct(file.fileId)
        })
        .from(file)
        .leftJoin(schedule, eq(file.fileId, schedule.fileId))
        .groupBy(file.folder, schedule.budgetAgencyTitle, schedule.budgetBureauTitle)
        .orderBy(file.folder, schedule.budgetAgencyTitle, schedule.budgetBureauTitle)
    )
  };
};

function groupDepartmentAgencyBureau(
  rows: { folder: string | null; agency: string | null; bureau: string | null; fileCount: number }[]
): object[] {
  const groupedByFolder = _map(groupBy(rows, 'folder'), (b, bi) => ({ folder: bi, rows: b }));
  return groupedByFolder.map((folder) => {
    const groupedByAgency = _map(groupBy(folder.rows, 'agency'), (b, bi) => ({
      agency: bi,
      rows: b
    }));
    return {
      ...folder,
      rows: groupedByAgency.map((agency) => {
        const groupedByBureau = _map(groupBy(agency.rows, 'bureau'), (b, bi) => ({
          bureau: bi,
          fileCount: b[0].fileCount
        }));
        return {
          ...agency,
          rows: groupedByBureau
        };
      })
    };
  });
}
