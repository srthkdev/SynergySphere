# AI Project Assistant Setup

SynergySphere now includes an AI Project Assistant powered by OpenAI to help with project management tasks, task planning, team collaboration advice, and more.

## Features

The AI Assistant can help with:

### 🎯 **Data-Driven Project Analysis**
- **Your Real Projects**: Access and analyze your actual project data
- **Task Status Tracking**: Get real-time insights on task progress and bottlenecks
- **Team Performance**: See who's working on what and identify workload distribution
- **Project Health**: Identify projects that need attention or are at risk

### 📊 **Personalized Insights**
- **Progress Reports**: Get summaries of your project progress and completion rates
- **Overdue Tasks**: Identify and prioritize overdue or high-priority items
- **Resource Analysis**: See team capacity and workload distribution
- **Budget Tracking**: Monitor project budgets and spending

### 🔍 **Smart Search & Discovery**
- **Project Search**: Find specific projects, tasks, or team members
- **Content Discovery**: Search across project descriptions and task details
- **Quick Filters**: Find high-priority tasks, upcoming deadlines, or specific statuses

### 💡 **Intelligent Recommendations**
- **Task Prioritization**: Get suggestions based on deadlines and dependencies
- **Team Optimization**: Recommendations for better resource allocation
- **Risk Identification**: Spot potential issues before they become problems
- **Process Improvement**: Suggestions based on your team's work patterns

## Setup Instructions

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (keep it secure!)

### 2. Configure Environment Variables

Add your OpenAI API key to your environment variables:

```bash
# In your .env.local file (create if it doesn't exist)
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Access the AI Assistant

1. Run your development server: `npm run dev`
2. Navigate to the AI Assistant section in the sidebar
3. Start chatting with your AI project management assistant!

## Usage Examples

### 🔍 **Data-Driven Questions** (NEW!)
- "Show me my active projects"
- "What tasks are overdue across all my projects?"
- "Who's working on what right now?"
- "Which projects need my attention?"
- "Give me a progress summary for Project X"
- "Find all high-priority tasks"
- "What's the team workload distribution?"

### 📋 **General Project Management**
- "How should I break down a mobile app development project?"
- "What's the best way to track team progress on tasks?"
- "How can I improve communication in my remote team?"
- "Help me create a timeline for a website redesign project"
- "What are some common project risks I should watch for?"
- "How do I facilitate effective team meetings?"

## Technical Details

- **Model**: GPT-4o-mini (cost-effective and fast)
- **Framework**: LangChain + LangGraph for AI orchestration and tool calling
- **Database Integration**: **Text-to-SQL** - Natural language questions converted to SQL queries
- **Query Approach**: 
  - User asks natural language question
  - AI converts to safe PostgreSQL query
  - Executes query against database
  - Uses results as context for response
- **Safety**: Only SELECT statements allowed, with SQL injection protection
- **Flexibility**: Can answer ANY question about your data - not limited to pre-built queries
- **Streaming**: Real-time response streaming for better UX
- **Context**: Maintains conversation history and user context for personalized responses

## Cost Considerations

GPT-4o-mini is very cost-effective:
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens

A typical conversation will cost fractions of a cent.

## Troubleshooting

### "OpenAI API key not configured" Error
- Ensure your `OPENAI_API_KEY` is set in your environment variables
- Restart your development server after adding the API key

### No Response from AI
- Check your internet connection
- Verify your OpenAI API key is valid and has credits
- Check the browser console for any JavaScript errors

### Rate Limiting
- OpenAI has rate limits for API calls
- If you hit limits, wait a moment before trying again
- Consider upgrading your OpenAI plan for higher limits

## Future Enhancements

Planned improvements:
- Project context awareness (integrate with your actual projects)
- Task creation directly from AI suggestions
- Meeting notes summarization
- Custom project templates based on AI recommendations
- Integration with calendar for timeline planning 