CREATE TABLE "commits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"github_sha" text NOT NULL,
	"user_message" text NOT NULL,
	"bundle_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "is_public" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sandbox_status" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "ssh_active" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_published" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "icon_url" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_sha" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "static_bundle_url" text;--> statement-breakpoint
ALTER TABLE "commits" ADD CONSTRAINT "commits_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;