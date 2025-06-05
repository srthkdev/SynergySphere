CREATE TYPE "public"."chat_source_type" AS ENUM('message', 'mention', 'reaction');--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"author_id" text NOT NULL,
	"read_by" json DEFAULT '[]'::json,
	"reactions" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_message_project_id_idx" ON "chat_messages" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "chat_message_task_id_idx" ON "chat_messages" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "chat_message_author_id_idx" ON "chat_messages" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "chat_message_created_at_idx" ON "chat_messages" USING btree ("created_at");