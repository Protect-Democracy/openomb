import {
  yearOptions,
  lineNumberOptions,
  tafsCountByCriterion,
  fileCountByCriterion,
  tafsByCriterion,
  type SearchParams
} from '$queries/search';
import { bureaus } from '$queries/tafs';
import { sortOptions } from '$config/search';
import type { PageServerData } from '../$types';

export const load: PageServerData = async ({ url }) => {
  const pageSize = 50;
  const pageIndex = url.searchParams.has('page') ? Number(url.searchParams.get('page')) : 1;
  let resultCount, fileCount, results;

  const startDateString = url.searchParams.get('approvedStart')
    ? url.searchParams.get('approvedStart')
    : '2020-01-01';
  const endDateString = url.searchParams.get('approvedEnd');

  // Only perform our search once the form is submitted
  if (url.searchParams.toString().length) {
    // Get our arguments for our search queries
    const agencyBureau = url.searchParams.get('agencyBureau')?.split(',');
    const searchArgs: SearchParams = {
      term: url.searchParams.get('term') || '',
      tafs: url.searchParams.get('tafs') || '',
      bureau: agencyBureau?.pop() || '',
      agency: agencyBureau?.pop() || '',
      account: url.searchParams.get('account') || '',
      approver: url.searchParams.get('approver') || '',
      year: url.searchParams.get('year')?.replace(/\[|"|\]/g, '') || '',
      approvedStart: new Date(`${startDateString}T00:00:00`),
      approvedEnd: endDateString ? new Date(`${endDateString}T23:59:59`) : new Date(),
      lineNum: url.searchParams.get('lineNum')?.replace(/\[|"|\]/g, '') || '',
      footnoteNum: url.searchParams.get('footnoteNum')?.replace(/\[|"|\]/g, '') || ''
    };

    // Execute prepared statements
    resultCount = tafsCountByCriterion(searchArgs);
    fileCount = fileCountByCriterion(searchArgs);
    results = tafsByCriterion({
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      sort: url.searchParams.get('sort'),
      ...searchArgs
    });
  }

  return {
    // Return numeric options as numbers
    yearOptions: await yearOptions(),
    lineOptions: await lineNumberOptions(),
    agencyBureauOptions: await bureaus(),
    sortOptions,
    resultCount: resultCount,
    fileCount: fileCount,
    pageSize,
    pageIndex,
    results: results
  };
};
