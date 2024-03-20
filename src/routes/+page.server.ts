import { db } from '$db/connection';
import { file } from '$schema/files';
import { desc, eq } from 'drizzle-orm';
import type { PageServerData } from './$types';

export const load: PageServerData = async () => {
  return {
    recentFiles: await db.select().from(file).orderBy(desc(file.approvalTimestamp)).limit(10),
    recentRemoved: await db
      .select()
      .from(file)
      .where(eq(file.removed, true))
      .orderBy(desc(file.modifiedAt))
      .limit(10)
  };
};
