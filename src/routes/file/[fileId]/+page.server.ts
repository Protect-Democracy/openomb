import { dbConnect } from '$db/connection';
import { fileDetails } from '$queries/files';
import type { PageServerData } from '../$types';
import { error } from '@sveltejs/kit';

export const load: PageServerData = async ({ params }) => {
  await dbConnect();

  const file = await fileDetails(params.fileId);

  if (!file) {
    error(404, 'Unable to find file');
  }

  return {
    file
  };
};
