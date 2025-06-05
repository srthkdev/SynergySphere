ALTER TABLE "budget" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "image_base64" text;--> statement-breakpoint
ALTER TABLE "budget" ADD COLUMN "image_type" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "image_base64" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "image_type" text;