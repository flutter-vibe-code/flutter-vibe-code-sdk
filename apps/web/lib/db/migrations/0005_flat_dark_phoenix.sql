ALTER TABLE "Document" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Message" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Stream" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Suggestion" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Vote_v2" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "Vote" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "Document" CASCADE;--> statement-breakpoint
DROP TABLE "Message" CASCADE;--> statement-breakpoint
DROP TABLE "Stream" CASCADE;--> statement-breakpoint
DROP TABLE "Suggestion" CASCADE;--> statement-breakpoint
DROP TABLE "Vote_v2" CASCADE;--> statement-breakpoint
DROP TABLE "Vote" CASCADE;--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "userId" SET DATA TYPE uuid;