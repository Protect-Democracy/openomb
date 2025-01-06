CREATE TABLE IF NOT EXISTS "searches" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"criterion" json,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" varchar NOT NULL,
	"itemId" varchar NOT NULL,
	"frequency" varchar DEFAULT 'daily' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"modified_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_userId_type_itemId_unique" UNIQUE("userId","type","itemId")
);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "modified_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "modified_at" timestamp DEFAULT now();--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "search_user_id_index" ON "searches" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_user_id_index" ON "subscriptions" ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_type_index" ON "subscriptions" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_item_id_index" ON "subscriptions" ("itemId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscription_frequency_index" ON "subscriptions" ("frequency");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "searches" ADD CONSTRAINT "searches_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
