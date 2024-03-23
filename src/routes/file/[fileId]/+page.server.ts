import { db } from '$db/connection';
import { file } from '$schema/files';
import { schedule } from '$schema/schedules';
import { footnote } from '$schema/footnotes';
import { eq } from 'drizzle-orm';
import type { PageServerData } from '../$types';
import { error } from '@sveltejs/kit';
import { uniqBy, groupBy } from 'lodash-es';

export const load: PageServerData = async ({ params }) => {
  const files = await db.select().from(file).where(eq(file.fileId, params.fileId)).limit(1);
  const schedules = await db
    .select()
    .from(schedule)
    .where(eq(schedule.fileId, params.fileId))
    .orderBy(schedule.scheduleIndex);
  const footnotes = await db
    .select()
    .from(footnote)
    .where(eq(footnote.fileId, params.fileId))
    .orderBy(footnote.footnoteNumber);

  if (!files || files.length !== 1) {
    error(404, 'Unable to find file');
  }

  return {
    file: files[0],
    schedules,
    footnotes,
    groupedSchedules: groupBy(schedules, 'tafsIterationId'),
    distinctFootnotes: uniqBy(footnotes, 'footnoteNumber')
  };
};
