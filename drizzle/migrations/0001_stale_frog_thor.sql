CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'on-hold', 'completed');--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "status" "project_status" DEFAULT 'planning' NOT NULL;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "priority" text DEFAULT 'medium';