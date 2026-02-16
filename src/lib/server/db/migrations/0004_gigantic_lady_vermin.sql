CREATE TABLE IF NOT EXISTS "line_descriptions" (
	"line_number" varchar PRIMARY KEY NOT NULL,
	"line_type_id" varchar NOT NULL,
	"description" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "line_descriptions" ADD CONSTRAINT "line_descriptions_line_type_id_line_types_line_type_id_fk" FOREIGN KEY ("line_type_id") REFERENCES "public"."line_types"("line_type_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "line_description_index" ON "line_descriptions" USING btree ("description");