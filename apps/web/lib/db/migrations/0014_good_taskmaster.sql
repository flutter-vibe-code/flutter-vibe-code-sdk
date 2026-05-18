ALTER TABLE "subscriptions" ALTER COLUMN "message_limit" SET DEFAULT '50';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "deployed_url" text;