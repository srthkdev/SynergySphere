import AIAgentDBChat from '@/components/ai-agent-db-chat';

export default function AIAssistantPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Simple Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          AI Assistant
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Get help with your projects and tasks using natural language queries
        </p>
      </div>

      {/* Full-width Chat Interface */}
      <div className="flex-1">
        <AIAgentDBChat />
      </div>
    </div>
  );
} 