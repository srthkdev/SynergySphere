'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal } from "lucide-react";
import { CreateEditTaskDialog } from "./CreateEditTaskDialog";
import { Task } from "@/types";

interface EditTaskButtonProps {
  task: any;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  iconOnly?: boolean;
}

export function EditTaskButton({ 
  task, 
  icon = <Edit className="h-4 w-4" />, 
  variant = "ghost", 
  size = "sm",
  className = "",
  iconOnly = false 
}: EditTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Convert from UI task model to API task model if needed
  const prepareTaskForEdit = () => {
    return {
      id: task.id,
      title: task.title,
      description: task.description || "",
      status: typeof task.status === 'string' 
        ? task.status.toUpperCase().replace('-', '_') 
        : task.status,
      priority: typeof task.priority === 'string' 
        ? task.priority.toUpperCase()
        : task.priority,
      dueDate: task.dueDate,
      projectId: task.projectId,
      assigneeId: task.assigneeId || null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      createdById: task.createdById || null,
      attachmentUrl: task.attachmentUrl || null,
    };
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title="Edit Task"
      >
        {iconOnly ? icon : (
          <>
            {icon}
            {!iconOnly && <span className="ml-2">Edit</span>}
          </>
        )}
      </Button>

      <CreateEditTaskDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        projectId={task.projectId}
        taskToEdit={prepareTaskForEdit()}
      />
    </>
  );
} 