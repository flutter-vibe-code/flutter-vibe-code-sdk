ALTER TABLE "subscriptions" ALTER COLUMN "message_limit" SET DEFAULT '10';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "forked_from" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "fork_count" text DEFAULT '0';--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_forked_from_projects_id_fk" FOREIGN KEY ("forked_from") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;