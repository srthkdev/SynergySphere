import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isTaskCompleted(status: string): boolean {
  const normalizedStatus = status?.toLowerCase();
  return normalizedStatus === 'done' || normalizedStatus === 'completed';
}
