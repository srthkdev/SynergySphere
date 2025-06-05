import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { textToSQLTools } from "@/lib/ai-tools/text-to-sql-tool";
import { getUser } from "@/lib/auth/auth-utils";

// Removed edge runtime because auth/email dependencies require Node.js modules

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const AGENT_SYSTEM_TEMPLATE = `You are Synergy Pro, an advanced AI Project Management Assistant for SynergySphere with direct database access through natural language to SQL conversion.

You can access and analyze ANY data in the database by asking natural language questions that get converted to SQL queries. This includes:
- Projects, tasks, users, budgets, comments, notifications
- Complex analytics and reporting
- Cross-table relationships and insights
- Time-based analysis and trends

When a user asks about their data:
1. **Use the text_to_sql_query tool** to convert their question into a SQL query and get results
2. **Analyze the returned data** to provide insights and answers
3. **Present findings clearly** with specific numbers, names, and actionable information

CRITICAL: When using the text_to_sql_query tool, format the input as:
"QUESTION: [user's question] | USER_ID: [current-user-id]"

For example:
- "QUESTION: Show me my active projects | USER_ID: user123"
- "QUESTION: What tasks are overdue? | USER_ID: user123"

Guidelines for using the database:
- Always query the actual data before answering questions about projects, tasks, or team info
- All queries are automatically filtered by user ID for security
- Provide specific, data-driven answers with real numbers and names
- Identify patterns, trends, and actionable insights from the data
- Highlight urgent items, overdue tasks, or areas needing attention

The current user ID will be provided in the context when available.`;

/**
 * Enhanced AI Project Agent with database access
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];

    // Get the authenticated user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to use the AI assistant." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const langChainMessages = messages
      .filter((message: VercelChatMessage) => 
        message.role === "user" || message.role === "assistant"
      )
      .map(convertVercelMessageToLangChainMessage);

    const model = new ChatOpenAI({
      temperature: 0.3, // Lower temperature for more factual responses when dealing with data
      model: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Create enhanced system message with user context
    const systemMessage = new SystemMessage(
      `${AGENT_SYSTEM_TEMPLATE}\n\nCurrent user ID: ${userId}\nCurrent user name: ${user.name}\nCurrent user email: ${user.email}\n\nWhen a user asks about "my projects" or "my tasks", use their user ID (${userId}) to fetch their specific data.`
    );

    // Create ReAct agent with text-to-SQL tools
    const agent = createReactAgent({
      llm: model,
      tools: textToSQLTools,
      messageModifier: systemMessage,
    });

    // Stream the response
    const eventStream = await agent.streamEvents(
      { messages: langChainMessages },
      { version: "v2", configurable: { recursionLimit: 10 } }
    );

    const textEncoder = new TextEncoder();
    const transformStream = new ReadableStream({
      async start(controller) {
        for await (const { event, data } of eventStream) {
          if (event === "on_chat_model_stream") {
            // Stream content when the model is generating final response
            if (!!data.chunk.content) {
              controller.enqueue(textEncoder.encode(data.chunk.content));
            }
          }
        }
        controller.close();
      },
    });

    return new Response(transformStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (e: any) {
    console.error("AI Agent DB Error:", e);
    return NextResponse.json(
      { error: e.message || "An error occurred while processing your request" },
      { status: e.status ?? 500 }
    );
  }
} 