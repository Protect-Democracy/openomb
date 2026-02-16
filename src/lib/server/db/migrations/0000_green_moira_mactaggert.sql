CREATE TABLE IF NOT EXISTS "collections" (
	"collection_id" varchar PRIMARY KEY NOT NULL,
	"start" timestamp NOT NULL,
	"complete" timestamp,
	"url" varchar NOT NULL,
	"status" varchar NOT NULL,
	"notes" text,
	"errors" text,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now(),
	CONSTRAINT "collections_start_unique" UNIQUE("start"),
	CONSTRAINT "collections_complete_unique" UNIQUE("complete")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"file_id" varchar PRIMARY KEY NOT NULL,
	"file_name" varchar,
	"fiscal_year" integer,
	"approval_timestamp" timestamp,
	"folder" varchar,
	"approver_title" varchar,
	"funds_provided_by" varchar,
	"folder_id" varchar,
	"approver_title_id" varchar,
	"funds_provided_by_parsed" varchar,
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
	"line_index" integer,
	"footnote_number" varchar NOT NULL,
	"footnote_text" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now(),
	CONSTRAINT "footnotes_file_id_line_index_footnote_number_pk" PRIMARY KEY("file_id","line_index","footnote_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lines" (
	"tafs_table_id" varchar,
	"line_index" integer DEFAULT 0,
	"line_number" varchar,
	"line_split" varchar,
	"line_description" varchar,
	"approved_amount" bigint,
	"file_id" varchar,
	"line_type" varchar,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now(),
	CONSTRAINT "lines_tafs_table_id_line_index_pk" PRIMARY KEY("tafs_table_id","line_index"),
	CONSTRAINT "lines_file_id_line_index_unique" UNIQUE("file_id","line_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tafs" (
	"file_id" varchar,
	"tafs_id" varchar NOT NULL,
	"iteration" integer NOT NULL,
	"fiscal_year" integer NOT NULL,
	"tafs_table_id" varchar,
	"cgac_agency" varchar NOT NULL,
	"cgac_acct" varchar NOT NULL,
	"allocation_agency_code" varchar,
	"allocation_subacct" varchar,
	"begin_poa" integer,
	"end_poa" integer,
	"account_id" varchar NOT NULL,
	"budget_agency_title" varchar,
	"budget_bureau_title" varchar,
	"account_title" varchar,
	"budget_agency_title_id" varchar,
	"budget_bureau_title_id" varchar,
	"account_title_id" varchar,
	"availability_type_code" boolean,
	"rpt_cat" boolean,
	"adj_aut" boolean,
	"iteration_description" text,
	"tafs_iteration_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now(),
	CONSTRAINT "tafs_file_id_tafs_id_iteration_fiscal_year_pk" PRIMARY KEY("file_id","tafs_id","iteration","fiscal_year"),
	CONSTRAINT "tafs_tafs_table_id_unique" UNIQUE("tafs_table_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "co_start_index" ON "collections" ("start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "co_complete_index" ON "collections" ("complete");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "co_status_index" ON "collections" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_file_name_index" ON "files" ("file_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_fiscal_year_index" ON "files" ("fiscal_year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_approval_timestamp_index" ON "files" ("approval_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_folder_index" ON "files" ("folder");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_folder_id_index" ON "files" ("folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_approver_title_index" ON "files" ("approver_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_approver_title_id_index" ON "files" ("approver_title_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_funds_provided_by_index" ON "files" ("funds_provided_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_funds_provided_by_parsed_index" ON "files" ("funds_provided_by_parsed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_removed_index" ON "files" ("removed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_created_at_index" ON "files" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_modified_at_index" ON "files" ("modified_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fn_file_footnote_index" ON "footnotes" ("file_id","footnote_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "line_line_number_index" ON "lines" ("line_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "line_line_split_index" ON "lines" ("line_split");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "line_line_description_index" ON "lines" ("line_description");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "line_approved_amount_index" ON "lines" ("approved_amount");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_cgac_agency_index" ON "tafs" ("cgac_agency");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_cgac_acct_index" ON "tafs" ("cgac_acct");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_allocation_agency_code_index" ON "tafs" ("allocation_agency_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_allocation_subacct_index" ON "tafs" ("allocation_subacct");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_account_id_index" ON "tafs" ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_budget_agency_title_index" ON "tafs" ("budget_agency_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_budget_bureau_title_index" ON "tafs" ("budget_bureau_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_account_title_index" ON "tafs" ("account_title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_iteration_description_index" ON "tafs" ("iteration_description");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_budget_agency_title_id_index" ON "tafs" ("budget_agency_title_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_budget_bureau_title_id_index" ON "tafs" ("budget_bureau_title_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_account_title_id_index" ON "tafs" ("account_title_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_rpt_cat_index" ON "tafs" ("rpt_cat");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_adj_aut_index" ON "tafs" ("adj_aut");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_created_at_index" ON "tafs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_modified_at_index" ON "tafs" ("modified_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "footnotes" ADD CONSTRAINT "footnotes_file_id_files_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "files"("file_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "footnotes" ADD CONSTRAINT "footnotes_file_id_line_index_lines_file_id_line_index_fk" FOREIGN KEY ("file_id","line_index") REFERENCES "lines"("file_id","line_index") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lines" ADD CONSTRAINT "lines_tafs_table_id_tafs_tafs_table_id_fk" FOREIGN KEY ("tafs_table_id") REFERENCES "tafs"("tafs_table_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lines" ADD CONSTRAINT "lines_file_id_files_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "files"("file_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tafs" ADD CONSTRAINT "tafs_file_id_files_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "files"("file_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
