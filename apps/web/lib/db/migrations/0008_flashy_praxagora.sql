ALTER TABLE "Chat" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users_teams" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users_teams" ALTER COLUMN "team_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "server_status" text DEFAULT 'closed';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_repo" text;