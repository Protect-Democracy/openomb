CREATE TABLE IF NOT EXISTS "collections" (
	"collection_id" varchar PRIMARY KEY NOT NULL,
	"start" timestamp NOT NULL,
	"complete" timestamp NOT NULL,
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
CREATE INDEX IF NOT EXISTS "start_index" ON "collections" ("start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "complete_index" ON "collections" ("complete");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_index" ON "collections" ("status");