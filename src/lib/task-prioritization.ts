import { Task } from '@/types';

// Constants
const URGENCY_WINDOW_DAYS = 30;     // caps urgency at 30 days
const MAX_EXPENSE_IMPACT = 1;       // expense/budget is already normalized to [0..1]
const DEFAULT_PROJECT_BUDGET = 100000; // Default budget if not specified

// Weights for different factors
const PRIORITY_WEIGHTS = {
  wUrgency: 0.5,   // Due date importance
  wStatus: 0.3,    // Priority status importance
  wCost: 0.2,      // Cost impact importance
};

// Helper function to check if task is completed
function isTaskCompleted(status: Task['status']): boolean {
  return status === 'DONE';
}

/**
 * Calculate urgency score based on due date
 * Returns a value between 0 and 1
 */
function calculateUrgencyScore(dueDate: string | undefined): number {
  if (!dueDate) return 0;
  
  const now = Date.now();
  const dueMs = new Date(dueDate).getTime();
  const msLeft = Math.max(dueMs - now, 0);
  const daysLeft = msLeft / (1000 * 60 * 60 * 24);

  const clamped = Math.min(daysLeft, URGENCY_WINDOW_DAYS);
  return (URGENCY_WINDOW_DAYS - clamped) / URGENCY_WINDOW_DAYS;
}

/**
 * Calculate priority status score
 * Returns a value between 0 and 1
 */
function calculateStatusScore(priority: string | undefined): number {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return 1.0;
    case 'high':
      return 0.75;
    case 'medium':
      return 0.5;
    case 'low':
    default:
      return 0.25;
  }
}

/**
 * Calculate cost impact score based on estimated hours
 * Returns a value between 0 and 1
 */
function calculateCostImpactScore(estimatedHours: number): number {
  // Normalize estimated hours to a 0-1 scale
  // Assuming 160 hours (1 month) as maximum
  return Math.min(estimatedHours / 160, MAX_EXPENSE_IMPACT);
}

/**
 * Calculate the total priority score for a task
 * Only calculates score for non-completed tasks
 */
function calculatePriorityScore(task: Task): number {
  const urgencyScore = calculateUrgencyScore(task.dueDate);
  const statusScore = calculateStatusScore(task.priority ?? undefined);
  const costScore = calculateCostImpactScore(task.estimatedHours || 0);

  return (
    PRIORITY_WEIGHTS.wUrgency * urgencyScore +
    PRIORITY_WEIGHTS.wStatus * statusScore +
    PRIORITY_WEIGHTS.wCost * costScore
  );
}

/**
 * Get priority info including P-level and score
 * Returns null for completed tasks
 */
export function getTaskPriorityInfo(task: Task, allTasks: Task[]): { priorityLevel: string; score: number } | null {
  // Don't calculate priority for completed tasks
  if (isTaskCompleted(task.status)) {
    return null;
  }
  
  // Filter out completed tasks and sort remaining by score
  const activeTasks = allTasks.filter(t => !isTaskCompleted(t.status));
  
  const sortedTasks = activeTasks
    .map(t => ({ ...t, score: calculatePriorityScore(t) }))
    .sort((a, b) => b.score - a.score);

  // Find position of current task
  const taskIndex = sortedTasks.findIndex(t => t.id === task.id);
  
  return {
    priorityLevel: `P-${taskIndex}`,
    score: calculatePriorityScore(task)
  };
}

/**
 * Get prioritized tasks with P-levels assigned
 * Returns only non-completed tasks
 */
export function getPrioritizedTasks(tasks: Task[]): (Task & { priorityInfo: { priorityLevel: string; score: number } })[] {
  // Filter out completed tasks first
  const activeTasks = tasks.filter(task => !isTaskCompleted(task.status));

  // Calculate scores for active tasks
  const tasksWithScores = activeTasks.map(task => ({
    ...task,
    priorityInfo: {
      score: calculatePriorityScore(task),
      priorityLevel: '' // Placeholder
    }
  }));

  // Sort by priority score
  const sortedTasks = tasksWithScores.sort((a, b) => 
    b.priorityInfo.score - a.priorityInfo.score
  );

  // Assign sequential P-levels to sorted tasks
  return sortedTasks.map((task, index) => ({
    ...task,
    priorityInfo: {
      ...task.priorityInfo,
      priorityLevel: `P-${index}`
    }
  }));
} 