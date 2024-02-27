CREATE TABLE IF NOT EXISTS "files" (
	"file_id" serial PRIMARY KEY NOT NULL,
	"file_name" varchar,
	"fiscal_year" integer,
	"approval_timestamp" timestamp,
	"folder" varchar,
	"approver_title" varchar,
	"funds_provided_by" varchar
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_name_index" ON "files" ("file_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fiscal_year_index" ON "files" ("fiscal_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approval_timestamp_index" ON "files" ("approval_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "folder_index" ON "files" ("folder");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approver_title_index" ON "files" ("approver_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funds_provided_by_index" ON "files" ("funds_provided_by");