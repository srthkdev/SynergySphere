import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types';
import { getPrioritizedTasks } from '@/lib/task-prioritization';

export function useTaskPriority(initialTasks: Task[]) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [prioritizedTasks, setPrioritizedTasks] = useState<Task[]>([]);

  // Update priorities whenever tasks change
  useEffect(() => {
    const updatedTasks = getPrioritizedTasks(tasks);
    setPrioritizedTasks(updatedTasks);
  }, [tasks]);

  // Function to update a task's status
  const updateTaskStatus = useCallback((taskId: string, newStatus: Task['status']) => {
    setTasks(currentTasks => {
      const updatedTasks = currentTasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      );
      return updatedTasks;
    });
  }, []);

  // Function to update any task field
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(currentTasks => {
      const updatedTasks = currentTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      );
      return updatedTasks;
    });
  }, []);

  return {
    tasks: prioritizedTasks,
    updateTaskStatus,
    updateTask,
    setTasks
  };
} 