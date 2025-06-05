-- Add new columns to the budget_entry table
ALTER TABLE "budget_entry" ADD COLUMN "name" text;
ALTER TABLE "budget_entry" ADD COLUMN "start_date" timestamp;
ALTER TABLE "budget_entry" ADD COLUMN "end_date" timestamp;
ALTER TABLE "budget_entry" ADD COLUMN "image_base64" text;
ALTER TABLE "budget_entry" ADD COLUMN "image_type" text; 