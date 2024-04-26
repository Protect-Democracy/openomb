// Dependencies
import type { filesSelect } from '$db/schema/files';
import type { tafsSelect } from '$db/schema/tafs';

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
  value?: Date | string,
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
export function formatDateISO(date?: Date | string): string {
  return date ? new Date(date).toISOString() : '';
}

/**
 * Format a file title
 *
 */
export function formatFileTitle(file: filesSelect) {
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
