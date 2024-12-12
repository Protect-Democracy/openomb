CREATE TABLE IF NOT EXISTS "line_types" (
	"line_type_id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"lower_limit" integer,
	"upper_limit" integer,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now()
);

--> Manually add data here for line types as existing data needs values for line_type_id
INSERT INTO "line_types" ("line_type_id", "name", "lower_limit", "upper_limit") VALUES
('obligations', 'Obligations by Program Activity', 1, 999),
('budgetary-resources', 'Budgetary Resources', 1000, 1999),
('budgetary-resources-status', 'Status of Budgetary Resources', 2000, 2999),
('obligated-balance-changes', 'Change in Obligated Balance', 3000, 3999),
('budget-authority', 'Budget Authority and Outlays, Net', 4000, 4999),
('memorandum', 'Memorandum (non-add) entries', 5000, 5999),
('budgetary-resources-application', 'Application of Budgetary Resources', 6000, 6999),
('unfunded-deficiencies', 'Unfunded Deficiencies', 7000, 7999),
('guaranteed-loan-levels', 'Guaranteed Loan Levels and Applications', 8000, 8999),
('other', 'Other', NULL, NULL);


--> statement-breakpoint
ALTER TABLE "lines" RENAME COLUMN "line_type" TO "line_type_id";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "line_type_name_index" ON "line_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "line_type_lower_limit_index" ON "line_types" USING btree ("lower_limit");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "line_type_upper_limit_index" ON "line_types" USING btree ("upper_limit");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lines" ADD CONSTRAINT "lines_line_type_id_line_types_line_type_id_fk" FOREIGN KEY ("line_type_id") REFERENCES "public"."line_types"("line_type_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
