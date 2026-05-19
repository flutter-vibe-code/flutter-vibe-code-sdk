CREATE TABLE "convex_project_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"team_slug" text NOT NULL,
	"project_slug" text NOT NULL,
	"deployment_url" text NOT NULL,
	"deployment_name" text NOT NULL,
	"admin_key" text NOT NULL,
	"access_token" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "convex_project_credentials_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "convex_project" json;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "convex_dev_running" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "convex_project_credentials" ADD CONSTRAINT "convex_project_credentials_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "convex_project_credentials" ADD CONSTRAINT "convex_project_credentials_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;