CREATE TABLE "twitter_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"twitter_user_id" text NOT NULL,
	"twitter_username" text NOT NULL,
	"linked_at" timestamp DEFAULT now(),
	CONSTRAINT "twitter_links_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "twitter_links_twitter_user_id_unique" UNIQUE("twitter_user_id")
);
--> statement-breakpoint
CREATE TABLE "x_bot_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tweet_id" text NOT NULL,
	"reply_tweet_id" text,
	"author_id" text,
	"tweet_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"project_id" uuid,
	"image_urls" json,
	"is_app_request" boolean DEFAULT false,
	"app_description" text,
	"generation_status" text,
	"reply_content" text,
	"replied_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "x_bot_replies_tweet_id_unique" UNIQUE("tweet_id")
);
--> statement-breakpoint
CREATE TABLE "x_bot_state" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"last_tweet_id" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "custom_domain_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cloudflare_project_name" text;--> statement-breakpoint
ALTER TABLE "twitter_links" ADD CONSTRAINT "twitter_links_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "x_bot_replies" ADD CONSTRAINT "x_bot_replies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;