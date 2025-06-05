import { DynamicTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// Database schema information for the AI to understand
const DATABASE_SCHEMA = `
-- SynergySphere Database Schema (User-Accessible Tables Only)

-- Enums
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');
CREATE TYPE project_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on-hold', 'completed');

-- Users table (for team member information)
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Projects table  
CREATE TABLE "project" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  tags TEXT, -- JSON string array of tags
  manager_id TEXT REFERENCES "user"(id), -- Project manager
  deadline TIMESTAMP, -- Project deadline
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by_id TEXT NOT NULL REFERENCES "user"(id)
);

-- Project members (many-to-many relationship between projects and users)
CREATE TABLE "project_member" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "project"(id),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  role project_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tasks table
CREATE TABLE "task" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'TODO',
  due_date TIMESTAMP,
  estimated_hours TEXT,
  project_id UUID NOT NULL REFERENCES "project"(id),
  assignee_id TEXT REFERENCES "user"(id),
  created_by_id TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  priority TEXT DEFAULT 'MEDIUM' -- 'LOW', 'MEDIUM', 'HIGH'
);

-- Comments table (for project and task discussions)
CREATE TABLE "comment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES "project"(id),
  task_id UUID REFERENCES "task"(id), -- Optional task reference
  author_id TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Notifications table (user notifications)
CREATE TABLE "notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'task_assigned', 'task_due_soon', 'comment_added', etc.
  project_id UUID REFERENCES "project"(id),
  task_id UUID REFERENCES "task"(id),
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Budget table (project financial management)
CREATE TABLE "budget" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "project"(id) UNIQUE, -- One budget per project
  name TEXT NOT NULL,
  description TEXT,
  total_budget INTEGER NOT NULL DEFAULT 0, -- in cents
  spent_amount INTEGER NOT NULL DEFAULT 0, -- in cents
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_by_id TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Budget entries (tracking expenses)
CREATE TABLE "budget_entry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES "budget"(id),
  name TEXT, -- Expense name
  amount INTEGER NOT NULL, -- in cents, can be negative for refunds
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- labor, materials, tools, etc.
  start_date TIMESTAMP, -- Expense period start
  end_date TIMESTAMP, -- Expense period end
  task_id UUID REFERENCES "task"(id), -- optional link to specific task
  created_by_id TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Attachments table (file attachments for projects/tasks)
CREATE TABLE "attachment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type (image/jpeg, application/pdf, etc.)
  file_size INTEGER NOT NULL, -- in bytes
  project_id UUID REFERENCES "project"(id),
  task_id UUID REFERENCES "task"(id),
  uploaded_by_id TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Chat messages table (project communication)
CREATE TABLE "chat_messages" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES "project"(id),
  task_id UUID REFERENCES "task"(id), -- Optional task reference
  author_id TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Common example queries:
-- 1. My projects: SELECT p.* FROM project p JOIN project_member pm ON p.id = pm.project_id WHERE pm.user_id = 'user-id'
-- 2. My tasks: SELECT * FROM task WHERE assignee_id = 'user-id' OR created_by_id = 'user-id'  
-- 3. Project tasks: SELECT t.*, u.name as assignee_name FROM task t LEFT JOIN user u ON t.assignee_id = u.id WHERE t.project_id = 'project-id'
-- 4. Project budget: SELECT b.*, (b.spent_amount/100.0) as spent_dollars FROM budget b WHERE b.project_id = 'project-id'
-- 5. Recent activity: SELECT 'task' as type, title as activity, created_at FROM task WHERE created_by_id = 'user-id' UNION SELECT 'comment' as type, content as activity, created_at FROM comment WHERE author_id = 'user-id' ORDER BY created_at DESC

-- HELPFUL QUERY PATTERNS AND HINTS:

-- GET PROJECT BUDGET INFORMATION:
-- Total budget for a project: SELECT name, (total_budget/100.0) as budget_dollars, (spent_amount/100.0) as spent_dollars, ((spent_amount * 100.0 / total_budget)) as percent_spent FROM budget WHERE project_id = 'project-uuid'
-- Budget breakdown by category: SELECT category, SUM(amount/100.0) as total_spent FROM budget_entry be JOIN budget b ON be.budget_id = b.id WHERE b.project_id = 'project-uuid' GROUP BY category
-- Recent expenses: SELECT name, description, (amount/100.0) as amount_dollars, category, created_at FROM budget_entry be JOIN budget b ON be.budget_id = b.id WHERE b.project_id = 'project-uuid' ORDER BY created_at DESC

-- GET PROJECT TEAM INFORMATION:
-- Project team members: SELECT u.name, u.email, pm.role, pm.joined_at FROM project_member pm JOIN user u ON pm.user_id = u.id WHERE pm.project_id = 'project-uuid'
-- Project managers/admins: SELECT u.name, pm.role FROM project_member pm JOIN user u ON pm.user_id = u.id WHERE pm.project_id = 'project-uuid' AND pm.role IN ('owner', 'admin')
-- Team workload: SELECT u.name, COUNT(t.id) as task_count FROM user u JOIN task t ON u.id = t.assignee_id JOIN project_member pm ON u.id = pm.user_id WHERE pm.project_id = 'project-uuid' GROUP BY u.id, u.name

-- GET TASK ANALYTICS:
-- Task status breakdown: SELECT status, COUNT(*) as count FROM task WHERE project_id = 'project-uuid' GROUP BY status
-- Overdue tasks: SELECT title, assignee_id, due_date FROM task WHERE project_id = 'project-uuid' AND due_date < NOW() AND status != 'DONE'
-- Tasks by priority: SELECT priority, COUNT(*) as count FROM task WHERE project_id = 'project-uuid' GROUP BY priority
-- My upcoming deadlines: SELECT title, due_date, priority FROM task WHERE (assignee_id = 'user-id' OR created_by_id = 'user-id') AND due_date > NOW() AND status != 'DONE' ORDER BY due_date

-- GET PROJECT ACTIVITY:
-- Recent project activity: SELECT 'task' as type, title as description, created_at FROM task WHERE project_id = 'project-uuid' UNION ALL SELECT 'comment' as type, LEFT(content, 50) as description, created_at FROM comment WHERE project_id = 'project-uuid' ORDER BY created_at DESC LIMIT 20
-- Project progress: SELECT COUNT(CASE WHEN status = 'DONE' THEN 1 END) as completed, COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress, COUNT(CASE WHEN status = 'TODO' THEN 1 END) as todo FROM task WHERE project_id = 'project-uuid'

-- GET FILES AND ATTACHMENTS:
-- Project attachments: SELECT file_name, file_type, (file_size/1024) as size_kb, u.name as uploaded_by, created_at FROM attachment a JOIN user u ON a.uploaded_by_id = u.id WHERE a.project_id = 'project-uuid'
-- Task attachments: SELECT file_name, file_type, t.title as task_title FROM attachment a JOIN task t ON a.task_id = t.id WHERE a.task_id = 'task-uuid'

-- GET COMMUNICATION DATA:
-- Recent chat messages: SELECT cm.content, u.name as author, cm.created_at FROM chat_messages cm JOIN user u ON cm.author_id = u.id WHERE cm.project_id = 'project-uuid' ORDER BY cm.created_at DESC LIMIT 20
-- Task discussions: SELECT c.content, u.name as author, c.created_at FROM comment c JOIN user u ON c.author_id = u.id WHERE c.task_id = 'task-uuid' ORDER BY c.created_at

-- TIME-BASED QUERIES:
-- This week's activity: WHERE created_at >= date_trunc('week', CURRENT_DATE)
-- This month's data: WHERE created_at >= date_trunc('month', CURRENT_DATE)  
-- Last 30 days: WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'

-- MONEY CALCULATIONS:
-- Always convert cents to dollars: (amount/100.0) as dollars
-- Calculate percentages: (spent_amount * 100.0 / total_budget) as percent_spent
-- Budget remaining: ((total_budget - spent_amount)/100.0) as remaining_dollars
`;

const TEXT_TO_SQL_TEMPLATE = `You are a SQL expert for the SynergySphere project management database.

Generate a JSON response with a safe PostgreSQL query based on the user's question.

Database Schema:
{schema}

Current User ID: {userId}
Today's Date: {currentDate}

User Question: {question}

CRITICAL SECURITY REQUIREMENTS:
- ALWAYS filter data by the current user's ID for security
- When querying projects: JOIN with project_member table and filter by user_id = '{userId}'
- When querying tasks: filter by assignee_id = '{userId}' OR created_by_id = '{userId}' OR join with projects the user has access to
- When querying budgets/attachments/comments: ensure they relate to user's projects/tasks only
- NEVER return data from users/projects the current user doesn't have access to

Query Guidelines:
- Only SELECT statements allowed (no INSERT, UPDATE, DELETE)
- Always include user ID filtering for security
- Use proper JOINs to get related data (user names, project names, etc.)
- Limit results to 100 rows maximum
- Use descriptive column aliases
- For date/time columns, consider using formatting functions
- For amounts in cents, convert to dollars when displaying (amount/100.0)
- Use TODAY'S DATE ({currentDate}) for relative time calculations

TIME REFERENCE EXAMPLES:
- "today" = '{currentDate}'
- "this week" = date_trunc('week', '{currentDate}'::date)
- "this month" = date_trunc('month', '{currentDate}'::date)
- "last 7 days" = '{currentDate}'::date - INTERVAL '7 days'
- "last month" = date_trunc('month', '{currentDate}'::date - INTERVAL '1 month')
- "overdue" = due_date < '{currentDate}'::date

Return ONLY a JSON object in this exact format:
{{
  "sql_query": "SELECT ... FROM ... WHERE ... (include user filtering)",
  "explanation": "Brief explanation of what this query does"
}}

User Question: {question}`;

export const textToSQLTool = new DynamicTool({
  name: "text_to_sql_query", 
  description: "Convert natural language questions about project data into SQL queries and execute them. Input should be in format: 'QUESTION: your question | USER_ID: user-id'",
  func: async (input: string) => {
    try {
      // Parse the input to extract question and user ID
      const parts = input.split('|').map(part => part.trim());
      const questionPart = parts.find(part => part.startsWith('QUESTION:'));
      const userIdPart = parts.find(part => part.startsWith('USER_ID:'));
      
      const question = questionPart ? questionPart.replace('QUESTION:', '').trim() : input;
      const userId = userIdPart ? userIdPart.replace('USER_ID:', '').trim() : 'unknown';

      if (!userId || userId === 'unknown') {
        return JSON.stringify({
          error: "User ID is required for security. Cannot access data without user context.",
          suggestion: "Please ensure user authentication is working properly."
        });
      }

      // Generate SQL using AI
      const sqlModel = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0, // Low temperature for consistent SQL generation
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      const sqlPrompt = PromptTemplate.fromTemplate(TEXT_TO_SQL_TEMPLATE);
      const sqlChain = sqlPrompt.pipe(sqlModel);
      
      const sqlResponse = await sqlChain.invoke({
        schema: DATABASE_SCHEMA,
        question: question,
        userId: userId,
        currentDate: new Date().toISOString().split('T')[0]
      });

      // Parse the JSON response from AI
      const responseText = sqlResponse.content.toString().trim();
      let sqlData;
      
      try {
        // Remove code blocks if present
        const cleanResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        sqlData = JSON.parse(cleanResponse);
      } catch (parseError) {
        return JSON.stringify({
          error: "Failed to parse SQL generation response",
          rawResponse: responseText,
          suggestion: "The AI response was not in the expected JSON format."
        });
      }

      const sqlQuery = sqlData.sql_query;
      const explanation = sqlData.explanation;

      // Safety checks
      if (!sqlQuery || !sqlQuery.toLowerCase().trim().startsWith('select')) {
        return JSON.stringify({
          error: "Only SELECT queries are allowed for security reasons.",
          generatedQuery: sqlQuery,
          explanation: explanation
        });
      }

      // Additional security check - ensure user ID filtering is present
      const queryLower = sqlQuery.toLowerCase();
      if (!queryLower.includes(userId.toLowerCase()) && !queryLower.includes('user_id') && !queryLower.includes('assignee_id')) {
        return JSON.stringify({
          error: "Query must include user ID filtering for security.",
          generatedQuery: sqlQuery,
          explanation: explanation,
          suggestion: "All queries must be filtered by the current user's data."
        });
      }

      // Execute the SQL query
      console.log("Executing SQL Query:", sqlQuery);
      console.log("Query Explanation:", explanation);
      
      const results = await db.execute(sql.raw(sqlQuery));
      
      return JSON.stringify({
        query: sqlQuery,
        explanation: explanation,
        results: results.rows,
        rowCount: results.rows.length,
        question: question,
        userId: userId
      });

    } catch (error: any) {
      console.error("Text-to-SQL Error:", error);
      return JSON.stringify({
        error: error.message,
        suggestion: "Try rephrasing your question or ask about specific projects, tasks, or team members.",
        input: input
      });
    }
  },
});

export const textToSQLTools = [textToSQLTool]; 