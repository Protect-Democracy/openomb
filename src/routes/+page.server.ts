import { db } from '$db/connection';
import { file } from '$schema/files';
import { desc } from 'drizzle-orm';
import type { PageServerData } from './$types';

export const load: PageServerData = async () => {
  return {
    recentFiles: await db.select().from(file).orderBy(desc(file.approvalTimestamp)).limit(10)
  };
};
