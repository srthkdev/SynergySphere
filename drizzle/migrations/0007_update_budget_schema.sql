-- First, add the columns if they don't exist (without NOT NULL constraints)
ALTER TABLE "budget" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "budget" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "budget" ADD COLUMN IF NOT EXISTS "start_date" timestamp;
ALTER TABLE "budget" ADD COLUMN IF NOT EXISTS "end_date" timestamp;
ALTER TABLE "budget" ADD COLUMN IF NOT EXISTS "image_base64" text;
ALTER TABLE "budget" ADD COLUMN IF NOT EXISTS "image_type" text;

-- Update existing records to populate the name field
UPDATE "budget" SET "name" = 'Budget for Project ' || SUBSTRING("project_id"::text, 1, 8) WHERE "name" IS NULL;

-- Now we can make the name column NOT NULL if desired
-- ALTER TABLE "budget" ALTER COLUMN "name" SET NOT NULL; 