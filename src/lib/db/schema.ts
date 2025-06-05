import { pgTable, text, timestamp, boolean, integer, pgEnum, uuid } from "drizzle-orm/pg-core";

// Enums - defined first to be used in table definitions
export const taskStatusEnum = pgEnum('task_status', ['TODO', 'IN_PROGRESS', 'DONE']);
export const projectRoleEnum = pgEnum('project_role', ['owner', 'admin', 'member', 'viewer']);
export const projectStatusEnum = pgEnum('project_status', ['planning', 'active', 'on-hold', 'completed']);

export const user = pgTable("user", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
  });

export const session = pgTable("session", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
});
// Projects table
export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").notNull().default('planning'),
  priority: text("priority").default("medium"), // low, medium, high
  tags: text("tags"), // JSON string array of tags
  managerId: text("manager_id")
    .references(() => user.id, { onDelete: "set null" }), // Project manager
  deadline: timestamp("deadline"), // Project deadline
  imageUrl: text("image_url"), // Project image/logo URL (can be data URL or external URL)
  imageBase64: text("image_base64"), // Base64 encoded image data
  imageType: text("image_type"), // MIME type of the image
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// Project Members (many-to-many relationship between projects and users)
export const projectMember = pgTable("project_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: projectRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// Tasks table
export const task = pgTable("task", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default('TODO'),
  dueDate: timestamp("due_date"),
  estimatedHours: text("estimated_hours"),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  assigneeId: text("assignee_id")
    .references(() => user.id, { onDelete: "set null" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  priority: text("priority").default("MEDIUM"), // LOW, MEDIUM, HIGH
  attachmentUrl: text("attachment_url"), // URL to attached image
});

// Comments for project discussions
export const comment = pgTable("comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  // Optional task reference for task-specific comments
  taskId: uuid("task_id")
    .references(() => task.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"), // For threaded comments - will be self-referenced
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notification table for project events
export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  type: text("type").notNull(), // e.g., "task_assigned", "task_due_soon", "comment_added"
  projectId: uuid("project_id")
    .references(() => project.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .references(() => task.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Budget table for project financial management
export const budget = pgTable("budget", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" })
    .unique(), // One budget per project
  name: text("name").notNull(), // Changed to not null
  description: text("description"),
  totalBudget: integer("total_budget").notNull().default(0), // in cents to avoid floating point issues
  spentAmount: integer("spent_amount").notNull().default(0), // in cents
  currency: text("currency").notNull().default("USD"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  imageBase64: text("image_base64"),
  imageType: text("image_type"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Budget entries for tracking expenses
export const budgetEntry = pgTable("budget_entry", {
  id: uuid("id").primaryKey().defaultRandom(),
  budgetId: uuid("budget_id")
    .notNull()
    .references(() => budget.id, { onDelete: "cascade" }),
  name: text("name"), // Expense name
  amount: integer("amount").notNull(), // in cents, can be negative for refunds
  description: text("description").notNull(),
  category: text("category").notNull().default("general"), // labor, materials, tools, etc.
  startDate: timestamp("start_date"), // Expense period start
  endDate: timestamp("end_date"), // Expense period end
  imageBase64: text("image_base64"), // Base64 encoded image data
  imageType: text("image_type"), // MIME type of the image
  taskId: uuid("task_id")
    .references(() => task.id, { onDelete: "set null" }), // optional link to specific task
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Attachments table for storing base64 file data
export const attachment = pgTable("attachment", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // MIME type (image/jpeg, application/pdf, etc.)
  fileSize: integer("file_size").notNull(), // in bytes
  base64Data: text("base64_data").notNull(), // base64 encoded file data
  projectId: uuid("project_id")
    .references(() => project.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .references(() => task.id, { onDelete: "cascade" }),
  uploadedById: text("uploaded_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add import for chat schema
export * from "./schema/chats";
