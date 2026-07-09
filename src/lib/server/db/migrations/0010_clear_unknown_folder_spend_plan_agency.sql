-- Data-only migration (no schema change): clear agency/bureau info on PDF files that landed in
-- Unknown Folder. A resolved agency on such a file only ever got there via a spend-plan PDF that
-- couldn't find a real (non-spend-plan) folder for its agency -- see loadPdfSpendPlan() in
-- src/lib/server/load-file.ts. Leaving budget_agency_title/budget_bureau_title set on these rows
-- let them be picked up by agencies()/bureaus() as if the agency had real apportionment data,
-- which in turn caused bin/check-agencies.ts to circularly treat these agencies as "already in
-- the system" when regenerating data/agency-reference.ts.
UPDATE "files"
SET "budget_agency_title" = NULL,
    "budget_agency_title_id" = NULL,
    "budget_bureau_title" = NULL,
    "budget_bureau_title_id" = NULL
WHERE "folder_id" = 'unknown-folder'
  AND "pdf_url" IS NOT NULL;
