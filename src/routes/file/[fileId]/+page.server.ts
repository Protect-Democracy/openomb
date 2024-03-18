import { db } from '$db/connection';
import { file } from '$schema/files';
import { eq } from 'drizzle-orm';
import type { PageServerData } from '../$types';
import { error } from '@sveltejs/kit';

export const load: PageServerData = async ({ params }) => {
  const files = await db.select().from(file).where(eq(file.fileId, params.fileId)).limit(1);

  if (!files || files.length !== 1) {
    error(404, 'Unable to find file');
  }

  return {
    file: files[0]
  };
};
