import { dbConnect } from '$db/connection';
import { fileDetails } from '$queries/files';
import { error } from '@sveltejs/kit';
import { formatFileTitle } from '$lib/formatters';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  await dbConnect();

  const file = await fileDetails(params.fileId);

  if (!file) {
    error(404, 'Unable to find file');
  }

  return {
    file,
    pageMeta: {
      title: `${formatFileTitle(file)} | ${file.fileId}`,
      // TODO
      description: 'Description of Some Page'
    }
  };
}
