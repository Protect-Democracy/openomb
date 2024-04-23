import { type PgTable, type WithSubqueryWithSelection } from 'drizzle-orm/pg-core';
import { type files } from '$db/schema/files';
import { type tafs } from '$db/schema/tafs';
import { desc, asc, type SQL, type InferSelectModel } from 'drizzle-orm';

type SortOption<T extends PgTable> = {
  label: string;
  sort: (
    table: T | WithSubqueryWithSelection<unknown & InferSelectModel<T>, string>
  ) => SQL<unknown>;
};

export const tafsSort: Record<string, SortOption<typeof tafs>> = {
  account_asc: { label: 'Account A-Z', sort: (table) => asc(table.accountTitle) },
  bureau_asc: { label: 'Bureau A-Z', sort: (table) => asc(table.budgetBureauTitle) },
  agency_asc: { label: 'Agency A-Z', sort: (table) => asc(table.budgetAgencyTitle) }
};

export const fileSort: Record<string, SortOption<typeof files>> = {
  approved_desc: { label: 'Most Recently Approved', sort: (table) => desc(table.approvalTimestamp) }
};

// Return sorts without sql for frontend select components
export const sortOptions = [
  ...Object.keys(tafsSort).map((key) => ({ key, label: tafsSort[key].label })),
  ...Object.keys(fileSort).map((key) => ({ key, label: fileSort[key].label }))
];
