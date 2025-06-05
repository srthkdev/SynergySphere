import { DynamicTool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// Database schema information for the AI to understand
const DATABASE_SCHEMA = `
-- SynergySphere Database Schema

-- Users table
CREATE TABLE "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table  
CREATE TABLE "project" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning', -- 'planning', 'active', 'on-hold', 'completed'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  tags TEXT, -- JSON string array
  manager_id TEXT REFERENCES "user"(id),
  deadline TIMESTAMP,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_id TEXT NOT NULL REFERENCES "user"(id)
);

-- Project members (many-to-many)
CREATE TABLE "project_member" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE "task" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'TODO', -- 'TODO', 'IN_PROGRESS', 'DONE'
  due_date TIMESTAMP,
  project_id UUID NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
  assignee_id TEXT REFERENCES "user"(id),
  created_by_id TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  priority TEXT DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH'
  attachment_url TEXT
);

-- Comments table
CREATE TABLE "comment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
  task_id UUID REFERENCES "task"(id) ON DELETE CASCADE,
  parent_id UUID, -- for threaded comments
  author_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE "notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'task_assigned', 'task_due_soon', 'comment_added', etc.
  project_id UUID REFERENCES "project"(id),
  task_id UUID REFERENCES "task"(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budget table
CREATE TABLE "budget" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "project"(id) ON DELETE CASCADE UNIQUE,
  total_budget INTEGER NOT NULL DEFAULT 0, -- in cents
  spent_amount INTEGER NOT NULL DEFAULT 0, -- in cents  
  currency TEXT DEFAULT 'USD',
  created_by_id TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budget entries
CREATE TABLE "budget_entry" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES "budget"(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- in cents, can be negative
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  task_id UUID REFERENCES "task"(id),
  created_by_id TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages  
CREATE TABLE "chat_messages" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES "project"(id) ON DELETE CASCADE,
  task_id UUID REFERENCES "task"(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  read_by JSON DEFAULT '[]', -- array of user IDs
  reactions JSON DEFAULT '{}', -- object of emoji -> user IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

const TEXT_TO_SQL_TEMPLATE = `You are a SQL expert for the SynergySphere project management database.

Generate a JSON response with a safe PostgreSQL query based on the user's question.

Database Schema:
{schema}

Current User ID: {userId}

User Question: {question}

CRITICAL SECURITY REQUIREMENTS:
- ALWAYS filter data by the current user's ID for security
- When querying projects: JOIN with project_member table and filter by user_id = '{userId}'
- When querying tasks: filter by assignee_id = '{userId}' OR created_by_id = '{userId}'
- When querying other data: ensure it relates to user's projects/tasks only
- NEVER return data from users/projects the current user doesn't have access to

Query Guidelines:
- Only SELECT statements
- Always include user ID filtering for security
- Use proper JOINs to get related data (user names, project names, etc.)
- Limit results to 50 rows maximum
- Use descriptive column aliases

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
        userId: userId
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