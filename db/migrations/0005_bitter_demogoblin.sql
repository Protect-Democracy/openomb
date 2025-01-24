ALTER TABLE "tafs" ADD COLUMN "tafs_id_formatted" varchar;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tafs_tafs_id_formatted_index" ON "tafs" USING btree ("tafs_id_formatted");