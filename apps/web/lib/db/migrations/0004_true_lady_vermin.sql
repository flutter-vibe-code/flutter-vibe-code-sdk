ALTER TABLE "projects" ADD COLUMN "sandbox_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "server_ready" boolean DEFAULT false;