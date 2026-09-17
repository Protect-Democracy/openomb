import { sortBy } from 'lodash-es';
import { fileDetails, fileTafsFootnotesByIds } from '$queries/files';
import { userSubscriptionsByItemIds } from '$queries/subscriptions';
import { error } from '@sveltejs/kit';
import { formatFileTitle } from '$lib/formatters';
import { fileSchema } from '$lib/schema';

/** @type {import('./$types').PageLoad} */
export async function load({ params, locals }) {
  const file = await fileDetails(params.fileId);

  if (!file) {
    error(404, 'Unable to find file');
  }

  const user = (await locals.auth())?.user;

  // Figure out which previous-iteration file each tafs row needs, from data
  // already present on file.tafs[].iterations (no DB access).
  const prevFileIdByTafsTableId: Record<string, string> = {};
  for (const taf of file.tafs || []) {
    if (!taf.tafsTableId) {
      continue;
    }
    const sorted = sortBy(taf.iterations, ['iteration']);
    const currentIndex = sorted.findIndex((iter) => iter.iteration === taf.iteration);
    if (currentIndex > 0) {
      const prev = sorted.at(currentIndex - 1);
      if (prev?.fileId) {
        prevFileIdByTafsTableId[taf.tafsTableId] = prev.fileId;
      }
    }
  }

  // Batched fetches, one call each, instead of one fileDetails()/
  // userSubscription() call per tafs row.
  const [prevFileDetailsById, subscriptionsByTafsTableId] = await Promise.all([
    fileTafsFootnotesByIds(Object.values(prevFileIdByTafsTableId)),
    user
      ? userSubscriptionsByItemIds(
          user.email,
          'tafs',
          (file.tafs || []).flatMap((taf) => (taf.tafsTableId ? [taf.tafsTableId] : []))
        )
      : new Map()
  ]);

  const prevIterationFiles: Record<string, unknown> = {};
  const tafsSubscriptions: Record<string, unknown> = {};
  for (const taf of file.tafs || []) {
    if (!taf.tafsTableId) {
      continue;
    }
    const prevFile = prevFileDetailsById.get(prevFileIdByTafsTableId[taf.tafsTableId]);
    if (prevFile) {
      prevIterationFiles[taf.tafsTableId] = prevFile;
    }
    if (user) {
      tafsSubscriptions[taf.tafsTableId] = subscriptionsByTafsTableId.get(taf.tafsTableId);
    }
  }

  return {
    file,
    prevIterationFiles,
    user,
    tafsSubscriptions,
    pageMeta: {
      title: `${formatFileTitle(file)} | ${file.fileId}`,
      // TODO
      description: `Apportionment file ${file.fileId} (${formatFileTitle(file)}) retrieved from OMB public records`,

      // Use a specific dataset schema for our file
      schema: fileSchema(file)
    }
  };
}
