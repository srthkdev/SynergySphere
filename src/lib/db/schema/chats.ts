import { text, pgTable, timestamp, index, json, pgEnum, uuid } from "drizzle-orm/pg-core";
import { user, project, task } from "../schema";

// Chat message table
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => task.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    readBy: json("read_by").$type<string[]>().default([]),
    reactions: json("reactions").$type<Record<string, string[]>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      projectIdIdx: index("chat_message_project_id_idx").on(table.projectId),
      taskIdIdx: index("chat_message_task_id_idx").on(table.taskId),
      authorIdIdx: index("chat_message_author_id_idx").on(table.authorId),
      createdAtIdx: index("chat_message_created_at_idx").on(table.createdAt),
    };
  }
);

// Chat message source type enum for notification source
export const chatSourceTypeEnum = pgEnum("chat_source_type", [
  "message",
  "mention",
  "reaction",
]); 