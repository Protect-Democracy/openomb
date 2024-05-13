// Dependencies
import { uniqBy, orderBy, filter } from 'lodash-es';
import type { filesSelect } from '$db/schema/files';
import type { tafsSelect } from '$db/schema/tafs';

// Types
interface FileWithTafs extends filesSelect {
  tafs?: tafsSelect[];
}

/**
 * Format a number
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format a number into currency format
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
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

  // No tafs information
  return `${file.folder} - ${file.fileId}`;
}

/**
 * Highlight part of a string based on a set of search terms
 */
export const highlight = function (text?: string | null, terms?: string[]): string {
  terms = terms ? terms : [];
  terms = filter(terms);

  if (!terms || terms.length < 1 || !text) {
    return text || '';
  }

  const regex = new RegExp(typeof terms === 'string' ? terms : terms.join('|'), 'gi');
  return text.replace(regex, '<mark>$&</mark>');
};

/**
 * Order array of strings by set of search terms
 */
export const highlightOrder = function (input?: string[], terms?: string[]): string[] {
  terms = terms ? terms : [];

  if (!terms || terms.length < 1 || !input) {
    return input || [];
  }

  const regex = new RegExp(typeof terms === 'string' ? terms : terms.join('|'), 'gi');
  return orderBy(input, (a) => (a.match(regex) ? 0 : 1));
};

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
