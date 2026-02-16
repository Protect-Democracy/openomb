// Dependencies
import { uniqBy, orderBy, filter, sumBy } from 'lodash-es';
import type { filesSelect } from '$schema/files';
import type { tafsSelect } from '$schema/tafs';

// Types
interface FileWithTafs extends filesSelect {
  tafs?: tafsSelect[];
}

/**
 * Format a number
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}

/**
 * Format a number into currency format
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(value);
}

/**

 * Format a Date (or date string) into standard date format
 * @param {Date | string} value
 * @returns {string}
 */
export function formatDate(
  value?: Date | string | null,
  format: 'full' | 'long' | 'medium' | 'short' = 'short'
): string {
  if (!value) {
    return '';
  }

  const date = typeof value === 'object' ? value : new Date(value);
  return new Intl.DateTimeFormat('en-US', { dateStyle: format }).format(date);
}

/**
 * Format a date to ISO
 */
export function formatDateISO(date?: Date | string | null): string {
  return date ? new Date(date).toISOString() : '';
}

/**
 * Format a file title
 */
export function formatFileTitle(file: FileWithTafs, highlightTerms?: string[]): string | null {
  const hasTafs = file?.tafs?.length && file?.tafs?.length > 0;
  let accounts = hasTafs
    ? uniqBy(
        file?.tafs?.map((t) => t.accountTitle),
        (a) => a
      )
    : [];

  // Has tafs accounts
  if (hasTafs && accounts?.length && accounts?.length > 0) {
    if (highlightTerms) {
      // Highlight accounts and make sure highlight ones are first
      accounts = highlightOrder(accounts.map((a) => highlight(a, highlightTerms)));
    }

    return accounts.length === 1
      ? accounts[0]
      : `${accounts[0]} and ${formatNumber(accounts.length - 1)} other account${accounts.length - 1 > 1 ? 's' : ''}`;
  }

  // Letter apportionment
  if (file?.pdfUrl && file.approvalTimestamp) {
    return `${file.folder}, Letter Apportionment - ${formatDate(file.approvalTimestamp, 'medium')}`;
  }

  // No tafs information
  return `${file.folder} - ${file.fileId}`;
}

/**
 * Consistent formatting of the TAFS ID.
 *
 * Examples:
 *  - 12-3510 2023/2024
 *  - 60-60-002-8051 /X
 *  - 69-0130 /2022
 *
 * Note that this not seem consistent in the Excel files and unsure what
 * this should be exactly.
 *
 * Have seen no years with the X in the middle and at the end
 *    - 080-X-1200
 *    - 60-60-002-8051 /X
 *
 * @param tafsRecord
 * @returns Formatted TAFS ID
 */
export const formatTafsFormattedId = (tafsRecord: tafsSelect): string => {
  const account = [
    tafsRecord.cgacAgency,
    tafsRecord.cgacAcct,
    tafsRecord.allocationAgencyCode,
    tafsRecord.allocationSubacct
  ]
    .filter(Boolean)
    .join('-');

  const years =
    tafsRecord.beginPoa && tafsRecord.endPoa && +tafsRecord.beginPoa !== +tafsRecord.endPoa
      ? `${tafsRecord.beginPoa}/${tafsRecord.endPoa}`
      : tafsRecord.beginPoa
        ? `/${tafsRecord.beginPoa}`
        : '/X';

  return `${account} ${years}`;
};

/**
 * Highlight part of a string based on a set of search terms
 */
export const highlight = function (text?: string | null, terms?: string[], trim?: number): string {
  terms = terms ? terms : [];
  terms = filter(terms.map((t) => t?.trim())).filter(Boolean);

  if (!terms || terms.length < 1 || !text) {
    return text || '';
  }

  if (!trim) {
    const regex = new RegExp(terms.join('|'), 'gi');
    return text.replace(regex, '<mark>$&</mark>');
  }
  else {
    // This is pretty hacky.  Ideally we could make this kind of like Google results and have multiple
    // highlights for each search, but for now, just make a single highlight.
    const wordLength = Math.round(sumBy(terms, (t) => t.length) / terms.length);
    const padding = Math.round(trim - wordLength / 2);
    const regex = new RegExp(
      `(\\S*.{0,${padding}})?(${terms.join('|')})(.{0,${padding}}\\S*)?`,
      'i'
    );
    const parts = text.match(regex);
    if (!parts) {
      return text.substring(0, trim) + (text.length > trim ? '...' : '');
    }
    return `${parts?.[1] ? '...' + parts?.[1] : ''}<mark>${parts?.[2]}</mark>${parts?.[3] ? parts?.[3] + '...' : ''}`;
  }
};

/**
 * Has highlight
 */
export const hasHighlight = function (text?: string): boolean {
  return text?.includes('<mark>') || false;
};

/**
 * Order array of strings by set of search terms
 */
export const highlightOrder = function (
  input?: string[] | object[],
  // TODO:
  // eslint-disable-next-line @typescript-eslint/ban-types
  accessor?: string | Function
): string[] | object[] {
  // Handle no input
  if (!input) {
    return [];
  }

  return orderBy(
    input,
    [
      (t) => {
        const value = accessor ? (typeof accessor === 'function' ? accessor(t) : t[accessor]) : t;
        return typeof value === 'string' && value.includes('<mark>') ? 0 : 1;
      },
      (t, ti) => ti
    ],
    ['asc', 'asc']
  );
};

/**
 * Link laws in text.
 */
export const linkLaws = function (text?: string): string {
  if (!text) {
    return '';
  }

  return text.replace(
    /(\s|^)([0-9]{3})-([0-9]+)(\s|$|,)/g,
    '$1<a href="https://www.congress.gov/$2/plaws/publ$3/PLAW-$2publ$3.pdf" target="_blank" rel="noopener noreferrer">$2-$3</a>$4'
  );
};

/**
 * Deconstruct text and link laws.
 *
 * Turn into an array of strings or objects so that we can use in
 * the client and utilize logic.
 */
export const deconstructLaws = function (text?: string): Array<string | object> {
  if (!text) {
    return [];
  }

  // Search regex
  const lawSearch = /(.*)([0-9]{3})-([0-9]+)(.*)/;

  // Turn into array
  const split = text.split(/\s+/);

  return split.map((text) => {
    const found = text.match(lawSearch);
    if (found) {
      return {
        url: `https://www.congress.gov/${found[2]}/plaws/publ${found[3]}/PLAW-${found[2]}publ${found[3]}.pdf`,
        text: `${found[2]}-${found[3]}`,
        pre: found[1],
        post: found[4]
      };
    }

    return text;
  });
};
