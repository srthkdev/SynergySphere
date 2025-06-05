import { z } from "zod";

// Project validation schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  status: z.enum(["planning", "active", "on-hold", "completed"]).default("planning"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  tags: z.string().optional(), // JSON string of tags array
  managerId: z.string().nullable().optional(), // Project manager user ID
  deadline: z.string().datetime().nullable().optional(), // ISO datetime string
  imageUrl: z.string().optional().or(z.literal("")), // Project image URL (can be data URL or external URL)
  imageBase64: z.string().optional(), // Base64 encoded image data
  imageType: z.string().optional(), // MIME type of the image
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  status: z.enum(["planning", "active", "on-hold", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  tags: z.string().optional(), // JSON string of tags array
  managerId: z.string().nullable().optional(), // Project manager user ID
  deadline: z.string().datetime().nullable().optional(), // ISO datetime string
  imageUrl: z.string().optional().or(z.literal("")), // Project image URL (can be data URL or external URL)
  imageBase64: z.string().optional(), // Base64 encoded image data
  imageType: z.string().optional(), // MIME type of the image
});

// Task validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").nullable().optional(),
  projectId: z.string().uuid("Invalid project ID"),
  assigneeId: z.string().nullable().optional(), // Allow any string format for user IDs (Auth.js uses text IDs, not UUIDs)
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters").optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").nullable().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  assigneeId: z.string().nullable().optional(), // Allow any string format for user IDs (Auth.js uses text IDs, not UUIDs)
  dueDate: z.string().datetime().nullable().optional(),
});

// Comment validation schema
export const createCommentSchema = z.object({
  content: z.string().min(1, "Content is required").max(2000, "Content must be less than 2000 characters"),
  projectId: z.string().uuid("Invalid project ID"),
  taskId: z.string().uuid("Invalid task ID").optional(),
  parentId: z.string().uuid("Invalid parent comment ID").optional(),
});

// Budget validation schemas
export const createBudgetSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  totalBudget: z.number().min(0, "Budget must be non-negative"),
  currency: z.string().length(3, "Currency must be 3 characters").default("USD"),
  startDate: z.string().datetime().optional(), // ISO datetime string
  endDate: z.string().datetime().optional(), // ISO datetime string
  imageBase64: z.string().optional(), // Base64 encoded image data
  imageType: z.string().optional(), // MIME type of the image
});

export const createBudgetEntrySchema = z.object({
  budgetId: z.string().uuid("Invalid budget ID"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  amount: z.number().int("Amount must be an integer"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  category: z.string().max(50, "Category must be less than 50 characters").default("general"),
  startDate: z.string().datetime().optional(), // ISO datetime string
  endDate: z.string().datetime().optional(), // ISO datetime string
  imageBase64: z.string().optional(), // Base64 encoded image data
  imageType: z.string().optional(), // MIME type of the image
  taskId: z.string().uuid("Invalid task ID").optional(),
});

// Utility function to validate request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: "Invalid input" };
  }
} 