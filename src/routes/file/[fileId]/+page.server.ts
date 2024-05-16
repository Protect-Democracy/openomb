import { fileDetails } from '$queries/files';
import { error } from '@sveltejs/kit';
import { formatFileTitle } from '$lib/formatters';
import { fileSchema } from '$lib/schema';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  const file = await fileDetails(params.fileId);

  if (!file) {
    error(404, 'Unable to find file');
  }

  return {
    file,
    pageMeta: {
      title: `${formatFileTitle(file)} | ${file.fileId}`,
      // TODO
      description: `Apportionment file ${formatFileTitle(file)} | ${file.fileId} retrieved from OMB public records`,

      // Use a specific dataset schema for our file
      schema: fileSchema(file)
    }
  };
}
