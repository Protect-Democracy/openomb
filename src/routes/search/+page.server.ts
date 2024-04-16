import { db, dbConnect } from '$db/connection';
import {
  yearOptions,
  lineNumberOptions,
  fileCountByCriterion,
  filesByCriterion,
} from '$queries/search';
import {
  bureaus,
} from '$queries/tafs';
import type { PageServerData } from '../$types';

export const load: PageServerData = async ({ url }) => {
  await dbConnect();

  const pageSize = 50;
  const pageIndex = url.searchParams.has('page') ? Number(url.searchParams.get('page')) : 1;
  let resultCount, results;

  // Only perform our search once the form is submitted
  if (url.searchParams && url.searchParams.get('term') != null) {

    // Get our arguments for our search queries
    const agencyBureau = url.searchParams.get('agencyBureau').split(',');
    const searchArgs = {
      term: url.searchParams.get('term') || '',
      tafs: url.searchParams.get('tafs') || '',
      bureau: agencyBureau?.pop() || '',
      agency: agencyBureau?.pop() || '',
      account: url.searchParams.get('account') || '',
      approver: url.searchParams.get('approver') || '',
      year: Number(url.searchParams.get('year')) || 0,
      lineNum: url.searchParams.get('lineNum').replace(/\[|\]/g, '') || '',
      footnoteNum: url.searchParams.get('footnoteNum') || '',
    };

    // Execute prepared statements
    resultCount = fileCountByCriterion(searchArgs);
    results = filesByCriterion({
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      ...searchArgs,
    });
  }

  return {
      // Return numeric options as numbers
      yearOptions: (await yearOptions()).map(o => Number(o)),
      lineOptions: (await lineNumberOptions()).map(o => Number(o)),
      agencyBureauOptions: await bureaus(),
      resultCount: resultCount,
      pageSize,
      pageIndex,
      results: results,
  };
};
