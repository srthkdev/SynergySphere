ALTER TABLE "project" ADD COLUMN "tags" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "manager_id" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "deadline" timestamp;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_manager_id_user_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;