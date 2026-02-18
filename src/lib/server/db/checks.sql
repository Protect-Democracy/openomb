-- Some manual data checks.

-- Footnotes.  33,178 rows.
SELECT
  file_id,
  footnote_number,
  COUNT(*)
FROM
  footnotes
GROUP BY
  file_id,
  footnote_number;

-- Files.  15,533 rows.
SELECT
  COUNT(*)
FROM
  files;

-- Schedules.  250,647 rows.
SELECT
  COUNT(*)
FROM
  schedules;

-- Schedule distribution
SELECT
  schedule_count_for_file,
  COUNT(*) AS occurrence_count
FROM
  (
    SELECT
      COUNT(*) as schedule_count_for_file
    FROM
      schedules
    GROUP BY
      file_id
  ) AS schedule_counts
GROUP BY
  schedule_count_for_file
ORDER BY
  schedule_count_for_file DESC;


-- Rows that did not find an Excel file.  0 found
SELECT
  *
FROM
  files
WHERE
  excel_url IS NULL;

-- Fiscal years.
SELECT
  fiscal_year,
  COUNT(*)
FROM
  files
GROUP BY
  fiscal_year;

-- Approval timestamp dates
SELECT
  DATE(approval_timestamp),
  COUNT(*)
FROM
  files
GROUP BY
  DATE(approval_timestamp)
ORDER BY
  DATE(approval_timestamp) DESC;

-- Approver titles
SELECT
  approver_title,
  COUNT(*)
FROM
  files
GROUP BY
  approver_title
ORDER BY
  approver_title ASC;

-- Folders
SELECT
  folder,
  COUNT(*)
FROM
  files
GROUP BY
  folder
ORDER BY
  folder ASC;

-- Funds provided by
SELECT
  funds_provided_by,
  COUNT(*)
FROM
  files
GROUP BY
  funds_provided_by
ORDER BY
  funds_provided_by ASC;

-- Created vs Modified
SELECT
  COUNT(*)
FROM
  files
WHERE
  created_at != modified_at;

-- Budget agency
SELECT
  budget_agency_title,
  COUNT(*)
FROM
  schedules
GROUP BY
  budget_agency_title
ORDER BY
  budget_agency_title ASC;

-- Budget bureau
SELECT
  budget_bureau_title,
  COUNT(*)
FROM
  schedules
GROUP BY
  budget_bureau_title
ORDER BY
  budget_bureau_title ASC;

-- Account title
-- It seems like there is some formatting issues here
--
-- Creating Helpful Incentives to Produce Semi-Conductors (CHIPS) f
-- Creating Helpful Incentives to Produce Semi-Conductors (CHIPS) F
-- Creating Helpful Incentives to Produce Semiconductors (CHIPS)
--
-- Debt Reduction - Financing Account
-- Debt Reduction Financing Account
SELECT
  account_title,
  COUNT(*)
FROM
  schedules
GROUP BY
  account_title
ORDER BY
  account_title ASC;

-- Allocation agency
SELECT
  allocation_agency_code,
  COUNT(*)
FROM
  schedules
GROUP BY
  allocation_agency_code
ORDER BY
  allocation_agency_code ASC;

-- CGAC agency
SELECT
  cgac_agency,
  COUNT(*)
FROM
  schedules
GROUP BY
  cgac_agency
ORDER BY
  cgac_agency ASC;

-- Begin POA (looks to be a number)
SELECT
  begin_poa,
  COUNT(*)
FROM
  schedules
GROUP BY
  begin_poa
ORDER BY
  begin_poa ASC;

-- Allocation sub account
SELECT
  allocation_subacct,
  COUNT(*)
FROM
  schedules
GROUP BY
  allocation_subacct
ORDER BY
  allocation_subacct ASC;

-- Iteration.  (looks to be a number)
SELECT
  iteration,
  COUNT(*)
FROM
  schedules
GROUP BY
  iteration
ORDER BY
  iteration ASC;

-- TAFS iteration  (is a number, but should be a string)
SELECT
  tafs_iteration_id,
  COUNT(*)
FROM
  schedules
GROUP BY
  tafs_iteration_id
ORDER BY
  tafs_iteration_id ASC;


-- Line number (not a number)
SELECT
  line_number,
  COUNT(*)
FROM
  schedules
GROUP BY
  line_number
ORDER BY
  line_number ASC;


-- Line split
SELECT
  line_split,
  COUNT(*)
FROM
  schedules
GROUP BY
  line_split
ORDER BY
  line_split ASC;


-- Created vs Modified
SELECT
  COUNT(*)
FROM
  schedules
WHERE
  created_at != modified_at;


-- Line split
SELECT
  footnote_number,
  COUNT(*)
FROM
  footnotes
GROUP BY
  footnote_number
ORDER BY
  footnote_number ASC;
