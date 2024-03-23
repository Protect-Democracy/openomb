/**
 * Format a number into currency format
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
