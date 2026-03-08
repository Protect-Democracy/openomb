// File sort options
export const fileSortOptions = [
  { key: 'approved_desc', label: 'Approved Newest First' },
  { key: 'approved_asc', label: 'Approved Oldest First' },
  { key: 'agency_asc', label: 'Agency A-Z' },
  { key: 'bureau_asc', label: 'Bureau A-Z' },
  { key: 'account_asc', label: 'Account A-Z' }
];

// Account sort options
export const accountSortOptions = [
  { key: 'account_asc', label: 'Account A-Z' },
  { key: 'account_desc', label: 'Account Z-A' },
  { key: 'file_count_desc', label: 'Most Files First' }
];

// Footnote number options
export const footnoteNumberOptions = ['A', 'B'];

/**
 * Manual descriptions for apportionment types
 */
export const apportionmentTypeDescriptions: Record<string, string> = {
  spreadsheet: 'Standard (Excel)',
  letter: 'Letter (PDF)',
  spend: 'Spend Plan'
};

export const filePageSize = 50;
export const accountPageSize = 10;
