/**
 * Search functionality for client and server
 */

// Dependencies
import { DateTime } from 'luxon';
import { isDate } from 'lodash-es';
import { formatDate } from '$lib/formatters';

// Types
import type {
  SavedSearchCriterion,
  SavedSearchCriterionUrl,
  LegacySearchCriterion
} from '$schema/searches';
import type { BureausResult } from '$queries/tafs';
import type { ApproverTitleOptionsResult } from '$queries/search';

/**
 * Manual descriptions for apportionment types
 */
export const apportionmentTypeDescriptions: Record<string, string> = {
  spreadsheet: 'Standard (Excel)',
  letter: 'Letter (PDF)'
};

/**
 * Make sure the criterion is in the correct format for saving and comparing.
 *
 * It's important that all the different inputs end up having consistent output,
 * so that they can be compared when searching for specific searches.
 */
export function parseCriterion(
  criterion: SavedSearchCriterionUrl | SavedSearchCriterion | LegacySearchCriterion | undefined
): SavedSearchCriterion {
  if (!criterion) {
    return {};
  }

  // The URL version could have agencyBureau
  const agencyBureau =
    'agencyBureau' in criterion && typeof criterion?.agencyBureau === 'string'
      ? criterion.agencyBureau?.split(',')
      : [];

  const emptyStringAsUndefined = <T>(value: T | '' | undefined): T | undefined => {
    return value === '' ? undefined : (value as T);
  };

  const emptyArrayAsUndefined = <T>(value: T[] | undefined): T[] | undefined => {
    if (value && Array.isArray(value) && value.length === 0) {
      return undefined;
    }
    else {
      return value;
    }
  };

  const parseStringArray = (value: string | string[] | undefined): string[] | undefined => {
    if (Array.isArray(value)) {
      return emptyArrayAsUndefined(value.filter(Boolean));
    }
    else if (typeof value === 'string') {
      return emptyArrayAsUndefined(
        value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      );
    }
    else {
      return undefined;
    }
  };

  // Ideally this and parseStringArray could be the same.
  const parseNumberArray = (
    value: string | string[] | number[] | undefined
  ): number[] | undefined => {
    if (Array.isArray(value)) {
      return emptyArrayAsUndefined(
        value
          .map((v) => {
            if (typeof v === 'number') {
              return v;
            }
            else if (typeof v === 'string') {
              const parsed = parseInt(v);
              return isNaN(parsed) ? undefined : parsed;
            }
            else {
              return undefined;
            }
          })
          .filter((n) => n !== undefined) as number[]
      );
    }
    else if (typeof value === 'string') {
      return emptyArrayAsUndefined(
        value
          .split(',')
          .map((s) => s.trim())
          .map((s) => parseInt(s))
          .filter((n) => !isNaN(n))
      );
    }
    else {
      return undefined;
    }
  };

  const parseDate = (value: string | Date | undefined): string | undefined => {
    if (isDate(value)) {
      // Cutout the date portion as ISO
      return value.toISOString().split('T')[0];
    }
    else if (typeof value === 'string') {
      // Try parsing as ISO date string, and if it's valid, return the date portion as ISO
      const parsed = DateTime.fromISO(value);
      return parsed.isValid ? parsed.toFormat('yyyy-MM-dd') : undefined;
    }
    else {
      return undefined;
    }
  };

  // Apportionment type has to be a specific value
  let apportionmentTypeArray = parseStringArray(criterion?.apportionmentType);
  let apportionmentType = (
    Array.isArray(apportionmentTypeArray)
      ? apportionmentTypeArray.filter((t) => Object.keys(apportionmentTypeDescriptions).includes(t))
      : undefined
  ) as SavedSearchCriterion['apportionmentType'];

  return {
    term: parseStringArray(criterion?.term),
    tafs: emptyStringAsUndefined(criterion.tafs),
    account: emptyStringAsUndefined(criterion.account),
    agencyBureau: emptyStringAsUndefined(criterion.agencyBureau),
    approver: parseStringArray(criterion?.approver),
    year: parseNumberArray(criterion?.year),
    lineNum: parseStringArray(criterion?.lineNum),
    footnoteNum: parseStringArray(criterion?.footnoteNum),
    apportionmentType: apportionmentType,
    approvedStart: parseDate(criterion.approvedStart),
    approvedEnd: parseDate(criterion.approvedEnd)
  };
}

/**
 * URL Search parameters to Saved Search Criterion
 */
export function parseUrlSearchParams(searchParams: URLSearchParams): SavedSearchCriterion {
  const paramsToParse = [
    'term',
    'tafs',
    'account',
    'agencyBureau',
    'approver',
    'year',
    'lineNum',
    'footnoteNum',
    'apportionmentType',
    'approvedStart',
    'approvedEnd'
  ];

  const criterionForParsing: SavedSearchCriterionUrl = {};

  for (const key of paramsToParse) {
    if (searchParams.has(key)) {
      // .getAll() grabs all instances of the key (e.g., ['2022', '2023'])
      // Joining with a comma leverages existing string parsing logic in parseCriterion
      criterionForParsing[key as keyof SavedSearchCriterionUrl] = searchParams
        .getAll(key)
        .join(',');
    }
  }

  return parseCriterion(criterionForParsing);
}

/**
 * Convert criterion to URL search params.
 */
export function criterionToUrlSearchParams(criterion: SavedSearchCriterion): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(criterion)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v.toString()));
      }
      else {
        searchParams.append(key, value.toString());
      }
    }
  }

  // The search UI checks that there is more than just term= in the URL to determine
  // if a search was preformed, so we need to include term and something else if there
  // are no other search params.
  if (searchParams.toString().length === 0) {
    searchParams.append('term', '');
    searchParams.append('year', '');
  }

  return searchParams;
}

/**
 * Compute descriptions for search criterion.
 */
export function searchCriterionDescriptions(
  criterion: SavedSearchCriterion | undefined,
  options?: {
    agencyBureauOptions?: BureausResult;
    approverTitleOptions?: ApproverTitleOptionsResult;
  }
): string[] | undefined {
  if (!criterion) {
    return;
  }

  const plural = (label: string, values: any[], plural: string = '(s)'): string => {
    return Array.isArray(values) && values.length > 1 ? `${label}${plural}` : label;
  };

  const criterionArray: Array<string> = [];

  if (criterion.term && criterion.term.length > 0) {
    criterionArray.push(`${plural('Keyword', criterion.term)}: '${criterion.term.join(', ')}'`);
  }

  if (criterion.tafs) {
    criterionArray.push(`TAFS: ${criterion.tafs}`);
  }

  if (criterion.agencyBureau) {
    let [agency, bureau] = criterion.agencyBureau.split(',').map((s) => s.trim());

    // Need at least agency
    if (agency) {
      // Default title is just the ID, but if we have options, we can find the title for it.
      let agencyBureauTitles: string[] = [agency, bureau];
      if (options?.agencyBureauOptions) {
        let agencyOption = options.agencyBureauOptions.find(
          (option) => option.budgetAgencyTitleId == agency
        );
        if (agencyOption) {
          agencyBureauTitles[0] = agencyOption.budgetAgencyTitle || '';
        }
        let bureauOption = options.agencyBureauOptions.find(
          (option) => option.budgetAgencyTitleId == agency && option.budgetBureauTitleId == bureau
        );
        if (bureauOption) {
          agencyBureauTitles[1] = bureauOption.budgetBureauTitle || '';
        }
      }

      criterionArray.push(`Agency / Bureau: ${agencyBureauTitles.filter(Boolean).join(' / ')}`);
    }
  }

  if (criterion.account) {
    criterionArray.push(`Account: ${criterion.account}`);
  }

  if (criterion.approver && criterion.approver.length > 0) {
    console.log(options);
    if (options?.approverTitleOptions) {
      const approverTitles = criterion.approver
        .map((approverId) => {
          const option = options.approverTitleOptions?.find((opt) => opt.value === approverId);
          return option ? option.label : approverId;
        })
        .filter(Boolean);
      criterionArray.push(`${plural('Approver', approverTitles)}: ${approverTitles.join(', ')}`);
    }
    else {
      criterionArray.push(
        `${plural('Approver', criterion.approver)}: ${criterion.approver.join(', ')}`
      );
    }
  }

  if (criterion.year && criterion.year.length > 0) {
    criterionArray.push(`${plural('Year', criterion.year)}: ${criterion.year.join(', ')}`);
  }

  if (criterion.lineNum && criterion.lineNum.length > 0) {
    criterionArray.push(`${plural('Line', criterion.lineNum)}: ${criterion.lineNum.join(', ')}`);
  }

  if (criterion.footnoteNum && criterion.footnoteNum.length > 0) {
    criterionArray.push(
      `${plural('Footnote', criterion.footnoteNum)}: ${criterion.footnoteNum.join(', ')}`
    );
  }

  if (criterion.apportionmentType && criterion.apportionmentType.length > 0) {
    criterionArray.push(
      `${plural('Apportionment Type', criterion.apportionmentType)}: ${criterion.apportionmentType
        .map((t) => apportionmentTypeDescriptions[t] || t)
        .join(', ')}`
    );
  }

  if (criterion.approvedStart) {
    criterionArray.push(`Approved After: ${formatDate(criterion.approvedStart, 'short')}`);
  }

  if (criterion.approvedEnd) {
    criterionArray.push(`Approved Before: ${formatDate(criterion.approvedEnd, 'short')}`);
  }

  return criterionArray.filter(Boolean);
}
