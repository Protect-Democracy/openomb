import { dbConnect } from '$db/connection';
import { fileDetails } from '$queries/files';
import { error } from '@sveltejs/kit';

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
      title: 'Some Page',
      description: 'Description of Some Page'
    }
  };
}
