ALTER TABLE "tafs" ADD COLUMN IF NOT EXISTS "tafs_formatted_id" varchar;
-- One-time backfill of tafs_formatted_id for rows loaded before the column existed. New rows get
-- this value from formatTafsFormattedId() (src/lib/formatters.ts) in src/lib/server/load-file.ts;
-- this SQL is a frozen copy of that function used only here, and
-- 0011_migration_statements.test.ts checks that the two produce the same output.
UPDATE "tafs"
SET "tafs_formatted_id" =
  CONCAT_WS('-',
    NULLIF("cgac_agency", ''),
    NULLIF("cgac_acct", ''),
    NULLIF("allocation_agency_code", ''),
    NULLIF("allocation_subacct", '')
  ) || ' ' ||
  CASE
    WHEN "begin_poa" IS NOT NULL AND "end_poa" IS NOT NULL AND "begin_poa" <> "end_poa"
      THEN "begin_poa"::text || '/' || "end_poa"::text
    WHEN "begin_poa" IS NOT NULL
      THEN '/' || "begin_poa"::text
    ELSE '/X'
  END
WHERE "tafs_formatted_id" IS NULL;
