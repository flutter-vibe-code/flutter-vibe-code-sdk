CREATE TABLE "ui_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"prompt" text NOT NULL,
	"thumbnail_url" text NOT NULL,
	"screenshot_urls" json DEFAULT '[]'::json,
	"video_preview_url" text,
	"remix_url" text,
	"tags" json DEFAULT '[]'::json,
	"view_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ui_prompts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "x_bot_state" ADD COLUMN "refresh_token" text;