import { db, dbConnect } from '$db/connection';
import {
  yearOptions,
  lineNumberOptions,
  fileCountByCriterion,
  filesByCriterion,
} from '$queries/search';
import type { PageServerData } from '../$types';

export const load: PageServerData = async ({ url }) => {
  await dbConnect();

  const pageSize = 50;
  const pageIndex = url.searchParams.has('page') ? Number(url.searchParams.get('page')) : 1;
  let resultCount, results;

  // Only perform our search once the form is submitted
  if (url.searchParams && url.searchParams.get('term') != null) {

    // Get our arguments for our search queries
    const searchArgs = {
      term: url.searchParams.get('term') || '',
      tafs: url.searchParams.get('tafs') || '',
      agency: url.searchParams.get('agency') || '',
      bureau: url.searchParams.get('bureau') || '',
      account: url.searchParams.get('account') || '',
      approver: url.searchParams.get('approver') || '',
      year: Number(url.searchParams.get('year')) || 0,
      lineNum: url.searchParams.get('lineNum') || '',
      footnoteNum: url.searchParams.get('footnoteNum') || '',
    };

    // Execute prepared statements
    resultCount = await fileCountByCriterion(searchArgs);
    results = await filesByCriterion({
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      ...searchArgs,
    });
  }

  return {
      yearOptions: await yearOptions(),
      lineOptions: await lineNumberOptions(),
      resultCount: resultCount || 0,
      pageSize,
      pageIndex,
      results: results || [],
  };
};
