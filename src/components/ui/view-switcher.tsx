'use client';

import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Kanban } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = 'list' | 'kanban' | 'gallery';

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  availableViews?: ViewMode[];
  className?: string;
}

const viewConfig = {
  list: {
    icon: List,
    label: 'List',
    description: 'Simple list layout'
  },
  kanban: {
    icon: Kanban,
    label: 'Kanban',
    description: 'Drag and drop columns'
  },
  gallery: {
    icon: LayoutGrid,
    label: 'Gallery',
    description: 'Card grid layout'
  },
};

export function ViewSwitcher({ 
  currentView, 
  onViewChange, 
  availableViews = ['list', 'kanban', 'gallery'],
  className 
}: ViewSwitcherProps) {
  return (
    <div className={cn("flex items-center space-x-1 bg-muted/50 p-1 rounded-lg border", className)}>
      {availableViews.map((view) => {
        const config = viewConfig[view];
        const Icon = config.icon;
        const isActive = currentView === view;
        
        return (
          <Button
            key={view}
            variant={isActive ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewChange(view)}
            className={cn(
              "h-8 px-3 transition-all duration-200",
              isActive && "bg-background shadow-sm border border-border"
            )}
            title={config.description}
          >
            <Icon className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline font-medium">{config.label}</span>
          </Button>
        );
      })}
    </div>
  );
} 