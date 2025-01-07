CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "source_text" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_source_text_index" ON "files" USING gin (source_text gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "footnote_text_index" ON "footnotes" USING gin (footnote_text gin_trgm_ops);
