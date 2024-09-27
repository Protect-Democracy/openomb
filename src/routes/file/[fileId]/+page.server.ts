import { sortBy } from 'lodash-es';
import { fileDetails } from '$queries/files';
import { error } from '@sveltejs/kit';
import { formatFileTitle } from '$lib/formatters';
import { fileSchema } from '$lib/schema';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  const file = await fileDetails(params.fileId);

  const prevIterationFiles = {};
  if (file?.tafs) {
    for (const taf of file.tafs) {
      const sorted = sortBy(taf.iterations, ['iteration']);
      const currentIndex = sorted.findIndex((iter) => iter.iteration === taf.iteration);
      if (currentIndex > 0) {
        const prev = sorted.at(currentIndex - 1);
        if (prev) {
          prevIterationFiles[taf.tafsTableId] = await fileDetails(prev.fileId);
        }
      }
    }
  }

  if (!file) {
    error(404, 'Unable to find file');
  }

  return {
    file,
    prevIterationFiles,
    pageMeta: {
      title: `${formatFileTitle(file)} | ${file.fileId}`,
      // TODO
      description: `Apportionment file ${file.fileId} (${formatFileTitle(file)}) retrieved from OMB public records`,

      // Use a specific dataset schema for our file
      schema: fileSchema(file)
    }
  };
}
