CREATE TABLE "spend_plans" (
	"file_id" varchar PRIMARY KEY NOT NULL,
	"file_name" varchar,
	"folder" varchar,
	"folder_id" varchar,
	"fiscal_year" integer,
	"budget_agency_title" varchar,
	"budget_bureau_title" varchar,
	"budget_agency_title_id" varchar,
	"budget_bureau_title_id" varchar,
	"excel_url" varchar,
	"pdf_url" varchar,
	"source_url" varchar NOT NULL,
	"source_data" text,
	"source_text" text,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now(),
	"removed" boolean DEFAULT false
);

CREATE INDEX "spend_plan_file_name_index" ON "spend_plans" USING btree ("file_name");
CREATE INDEX "spend_plan_folder_index" ON "spend_plans" USING btree ("folder");
CREATE INDEX "spend_plan_folder_id_index" ON "spend_plans" USING btree ("folder_id");
CREATE INDEX "spend_plan_fiscal_year_index" ON "spend_plans" USING btree ("fiscal_year");
CREATE INDEX "spend_plan_budget_agency_title_index" ON "spend_plans" USING btree ("budget_agency_title");
CREATE INDEX "spend_plan_budget_bureau_title_index" ON "spend_plans" USING btree ("budget_bureau_title");
CREATE INDEX "spend_plan_budget_agency_title_id_index" ON "spend_plans" USING btree ("budget_agency_title_id");
CREATE INDEX "spend_plan_budget_bureau_title_id_index" ON "spend_plans" USING btree ("budget_bureau_title_id");
CREATE INDEX "spend_plan_excel_url_index" ON "spend_plans" USING btree ("excel_url");
CREATE INDEX "spend_plan_pdf_url_index" ON "spend_plans" USING btree ("pdf_url");
CREATE INDEX "spend_plan_source_url_index" ON "spend_plans" USING btree ("source_url");
CREATE INDEX "spend_plan_removed_index" ON "spend_plans" USING btree ("removed");
CREATE INDEX "spend_plan_created_at_index" ON "spend_plans" USING btree ("created_at");
CREATE INDEX "spend_plan_modified_at_index" ON "spend_plans" USING btree ("modified_at");
CREATE INDEX "spend_plan_source_text_index" ON "spend_plans" USING gin (source_text gin_trgm_ops);