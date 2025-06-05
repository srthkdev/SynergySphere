ALTER TABLE "budget" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "image_base64" text;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "image_type" text;--> statement-breakpoint
ALTER TABLE "budget_entry" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "budget_entry" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "budget_entry" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "budget_entry" ADD COLUMN "image_base64" text;--> statement-breakpoint
ALTER TABLE "budget_entry" ADD COLUMN "image_type" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "estimated_hours" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" text;