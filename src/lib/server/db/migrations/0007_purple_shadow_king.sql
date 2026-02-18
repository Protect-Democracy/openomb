ALTER TABLE "searches" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "userId" TO "user_id";--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "itemId" TO "item_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_userId_type_itemId_unique";--> statement-breakpoint
ALTER TABLE "searches" DROP CONSTRAINT "searches_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_userId_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "search_user_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "subscription_user_id_index";--> statement-breakpoint
DROP INDEX IF EXISTS "subscription_item_id_index";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "searches" ADD CONSTRAINT "searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_user_id_index" ON "searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_user_id_index" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_item_id_index" ON "subscriptions" USING btree ("item_id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_type_item_id_unique" UNIQUE NULLS NOT DISTINCT("user_id","type","item_id");