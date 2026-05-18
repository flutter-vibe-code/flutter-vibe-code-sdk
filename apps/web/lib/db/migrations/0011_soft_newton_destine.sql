CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"customer_id" text,
	"current_plan" text DEFAULT 'free',
	"subscription_id" text,
	"product_id" text,
	"checkout_id" text,
	"status" text DEFAULT 'inactive',
	"subscribed_at" timestamp,
	"cancelled_at" timestamp,
	"expires_at" timestamp,
	"message_limit" text DEFAULT '10',
	"messages_used" text DEFAULT '0',
	"reset_date" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;