import { dbConnect } from '$db/connection';
import { recentlyApprovedWithTafs, approverDetails } from '$queries/files';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  await dbConnect();

  const approver = await approverDetails(params.approverId);

  if (!approver) {
    error(404, 'Unable to find approver');
  }

  return {
    approver,
    recentlyApproved: await recentlyApprovedWithTafs(20, {
      approverId: params.approverId
    }),
    pageMeta: {
      title: `Approver: ${approver.approverTitle}`
    }
  };
}
