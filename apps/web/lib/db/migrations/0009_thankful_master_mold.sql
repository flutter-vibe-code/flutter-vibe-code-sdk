ALTER TABLE "Message_v2" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "Message_v2" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "id" DROP DEFAULT;