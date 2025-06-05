'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Receipt,
  Target,
  Calendar,
  User,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth/auth-client';
import { 
  fetchTasksByProjectId,
  fetchBudgetEntries,
  createBudgetEntry, 
  deleteBudgetEntry 
} from '@/lib/queries';

interface Budget {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  totalBudget: number;
  spentAmount: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  imageBase64?: string;
  imageType?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface BudgetEntry {
  id: string;
  budgetId: string;
  amount: number;
  description: string;
  category: string;
  taskId?: string;
  taskTitle?: string;
  createdById: string;
  createdAt: string;
}

interface BudgetTabProps {
  projectId: string;
}

const categories = [
  'general',
  'labor',
  'materials',
  'tools',
  'software',
  'infrastructure',
  'marketing',
  'travel',
  'other'
];

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100); // Convert from cents
};

export function BudgetTab({ projectId }: BudgetTabProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);

  // Fetch project budget
  const { data: budget, isLoading: budgetLoading } = useQuery<Budget>({
    queryKey: ['budget', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/budget`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch budget');
      }
      return response.json();
    },
  });

  // Get budget entries if budget exists
  const { 
    data: budgetEntries = [], 
    isLoading: entriesLoading 
  } = useQuery<BudgetEntry[]>({
    queryKey: ['budgetEntries', budget?.id],
    queryFn: () => budget ? fetchBudgetEntries(budget.id) : Promise.resolve([]),
    enabled: !!budget?.id,
  });

  // Fetch tasks for the project
  const { 
    data: projectTasks = [], 
    isLoading: tasksLoading 
  } = useQuery({
    queryKey: ['projectTasks', projectId],
    queryFn: () => fetchTasksByProjectId(projectId),
    enabled: !!projectId,
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (data: { 
      totalBudget: number; 
      currency: string;
      name: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      imageBase64?: string;
      imageType?: string;
    }) => {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          totalBudget: data.totalBudget * 100, // Convert to cents
          currency: data.currency,
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          imageBase64: data.imageBase64,
          imageType: data.imageType,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || 'Failed to create budget');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      setIsCreateBudgetOpen(false);
      toast.success('Budget created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      description: string;
      category: string;
      taskId?: string;
    }) => {
      if (!budget?.id) throw new Error('Budget ID not found');
      return createBudgetEntry({
        budgetId: budget.id,
        ...data
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetEntries', budget?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      setIsAddExpenseOpen(false);
      toast.success('Expense added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (entryId: string) => deleteBudgetEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetEntries', budget?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      toast.success('Expense deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleCreateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const totalBudget = parseFloat(formData.get('totalBudget') as string);
    const currency = formData.get('currency') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    
    if (!name) {
      toast.error('Budget name is required');
      return;
    }

    if (totalBudget <= 0) {
      toast.error('Budget amount must be greater than 0');
      return;
    }

    createBudgetMutation.mutate({ 
      totalBudget, 
      currency, 
      name, 
      description: description || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const taskId = formData.get('taskId') as string;
    
    if (!budget) {
      toast.error('Please create a budget first');
      return;
    }
    
    addExpenseMutation.mutate({
      amount,
      description,
      category: category || 'general',
      taskId: taskId || undefined
    });
  };

  if (budgetLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading budget...</p>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Budget Set</h3>
          <p className="text-muted-foreground mb-6">
            Create a budget for this project to track expenses and manage finances.
          </p>
          <Dialog open={isCreateBudgetOpen} onOpenChange={setIsCreateBudgetOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project Budget</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div>
                  <Label htmlFor="name">Budget Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter budget name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter budget description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="totalBudget">Total Budget</Label>
                  <Input
                    id="totalBudget"
                    name="totalBudget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter total budget"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select name="currency" defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateBudgetOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBudgetMutation.isPending}>
                    {createBudgetMutation.isPending ? 'Creating...' : 'Create Budget'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  const remainingBudget = budget.totalBudget - budget.spentAmount;
  const utilizationPercentage = budget.totalBudget > 0 
    ? Math.round((budget.spentAmount / budget.totalBudget) * 100) 
    : 0;

  const getStatusColor = () => {
    if (utilizationPercentage >= 100) return 'text-red-600';
    if (utilizationPercentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (utilizationPercentage >= 100) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (utilizationPercentage >= 80) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(budget.totalBudget, budget.currency)}
            </div>
            <p className="text-xs text-muted-foreground">Allocated for project</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(budget.spentAmount, budget.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {utilizationPercentage}% of budget used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            {getStatusIcon()}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor()}`}>
              {formatCurrency(remainingBudget, budget.currency)}
            </div>
            <p className="text-xs text-muted-foreground">Available to spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Budget Utilization
            <Badge variant={utilizationPercentage >= 100 ? 'destructive' : 'default'}>
              {utilizationPercentage}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={Math.min(utilizationPercentage, 100)} 
            className="h-3"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Spent: {formatCurrency(budget.spentAmount, budget.currency)}</span>
            <span>Budget: {formatCurrency(budget.totalBudget, budget.currency)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Budget Details */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
              <p>{budget.name || 'Unnamed Budget'}</p>
            </div>
            
            {budget.description && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                <p>{budget.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {budget.startDate && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Start Date</h3>
                  <p>{new Date(budget.startDate).toLocaleDateString()}</p>
                </div>
              )}
              
              {budget.endDate && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">End Date</h3>
                  <p>{new Date(budget.endDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {budget.imageBase64 && budget.imageType && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Budget Image</h3>
                <div className="mt-2">
                  <img 
                    src={`data:${budget.imageType};base64,${budget.imageBase64}`}
                    alt="Budget image"
                    className="max-h-48 rounded object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expenses</CardTitle>
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe the expense"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue="general">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="taskId">Related Task (Optional)</Label>
                    <Select name="taskId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {tasksLoading ? (
                          <SelectItem value="loading" disabled>Loading tasks...</SelectItem>
                        ) : projectTasks.length === 0 ? (
                          <SelectItem value="none" disabled>No tasks available</SelectItem>
                        ) : (
                          projectTasks.map((task) => (
                            <SelectItem key={task.id} value={task.id}>
                              {task.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddExpenseOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addExpenseMutation.isPending}>
                      {addExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {entriesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading expenses...</p>
            </div>
          ) : budgetEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expenses recorded yet.</p>
              <p className="text-sm">Click "Add Expense" to record a new expense.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetEntries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{entry.description}</h4>
                        <Badge variant="outline" className="text-xs">
                          {entry.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                        {entry.taskTitle && ` • Task: ${entry.taskTitle}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {formatCurrency(entry.amount, budget.currency)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingEntry(entry)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteExpenseMutation.mutate(entry.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 