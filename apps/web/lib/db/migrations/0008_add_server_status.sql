ALTER TABLE "projects" ADD COLUMN "server_status" text DEFAULT 'closed';
ALTER TABLE "projects" ADD CONSTRAINT "projects_server_status_check" CHECK ("server_status" IN ('running', 'closed')); 