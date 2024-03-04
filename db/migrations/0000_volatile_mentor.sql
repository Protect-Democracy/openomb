CREATE TABLE IF NOT EXISTS "files" (
	"file_id" varchar PRIMARY KEY NOT NULL,
	"file_name" varchar,
	"fiscal_year" integer,
	"approval_timestamp" timestamp,
	"folder" varchar,
	"approver_title" varchar,
	"funds_provided_by" varchar,
	"excel_url" varchar,
	"pdf_url" varchar,
	"source_url" varchar NOT NULL,
	"source_data" text,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now(),
	"removed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "footnotes" (
	"file_id" varchar,
	"schedule_index" integer,
	"footnote_number" varchar NOT NULL,
	"footnote_text" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now(),
	CONSTRAINT "footnotes_file_id_schedule_index_footnote_number_pk" PRIMARY KEY("file_id","schedule_index","footnote_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"file_id" varchar,
	"schedule_index" integer DEFAULT 0,
	"budget_agency_title" varchar,
	"budget_bureau_title" varchar,
	"account_title" varchar,
	"allocation_agency_code" varchar,
	"cgac_agency" varchar,
	"begin_poa" integer,
	"end_poa" integer,
	"availability_type_code" varchar,
	"cgac_acct" varchar,
	"allocation_subacct" varchar,
	"iteration" integer,
	"tafs_iteration_id" varchar,
	"line_number" varchar,
	"line_split" varchar,
	"line_description" varchar,
	"approved_amount" bigint,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now(),
	CONSTRAINT "schedules_file_id_schedule_index_pk" PRIMARY KEY("file_id","schedule_index")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_name_index" ON "files" ("file_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fiscal_year_index" ON "files" ("fiscal_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approval_timestamp_index" ON "files" ("approval_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "folder_index" ON "files" ("folder");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approver_title_index" ON "files" ("approver_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funds_provided_by_index" ON "files" ("funds_provided_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "removed_index" ON "files" ("removed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_footnote_index" ON "footnotes" ("file_id","footnote_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_agency_title_index" ON "schedules" ("budget_agency_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budget_bureau_title_index" ON "schedules" ("budget_bureau_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_title_index" ON "schedules" ("account_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "allocation_agency_code_index" ON "schedules" ("allocation_agency_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cgac_agency_index" ON "schedules" ("cgac_agency");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "approved_amount_index" ON "schedules" ("approved_amount");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "footnotes" ADD CONSTRAINT "footnotes_file_id_files_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "files"("file_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "footnotes" ADD CONSTRAINT "footnotes_file_id_schedule_index_schedules_file_id_schedule_index_fk" FOREIGN KEY ("file_id","schedule_index") REFERENCES "schedules"("file_id","schedule_index") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_file_id_files_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "files"("file_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
