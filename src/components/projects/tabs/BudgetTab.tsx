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
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/lib/auth/auth-client';

interface Budget {
  id: string;
  projectId: string;
  totalBudget: number;
  spentAmount: number;
  currency: string;
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

  // Fetch budget entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery<BudgetEntry[]>({
    queryKey: ['budgetEntries', budget?.id],
    queryFn: async () => {
      if (!budget?.id) return [];
      const response = await fetch(`/api/budgets/${budget.id}/entries`);
      if (!response.ok) throw new Error('Failed to fetch budget entries');
      return response.json();
    },
    enabled: !!budget?.id,
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (data: { totalBudget: number; currency: string }) => {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          totalBudget: data.totalBudget * 100, // Convert to cents
          currency: data.currency,
        }),
      });
      if (!response.ok) throw new Error('Failed to create budget');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      setIsCreateBudgetOpen(false);
      toast.success('Budget created successfully');
    },
    onError: () => {
      toast.error('Failed to create budget');
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
      const response = await fetch('/api/budget-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId: budget?.id,
          amount: data.amount * 100, // Convert to cents
          description: data.description,
          category: data.category,
          taskId: data.taskId || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to add expense');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetEntries', budget?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      setIsAddExpenseOpen(false);
      toast.success('Expense added successfully');
    },
    onError: () => {
      toast.error('Failed to add expense');
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/budget-entries/${entryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete expense');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetEntries', budget?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget', projectId] });
      toast.success('Expense deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete expense');
    },
  });

  const handleCreateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const totalBudget = parseFloat(formData.get('totalBudget') as string);
    const currency = formData.get('currency') as string;

    if (totalBudget <= 0) {
      toast.error('Budget amount must be greater than 0');
      return;
    }

    createBudgetMutation.mutate({ totalBudget, currency });
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const taskId = formData.get('taskId') as string;

    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }

    addExpenseMutation.mutate({
      amount,
      description: description.trim(),
      category,
      taskId: taskId || undefined,
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
                    <Input
                      id="taskId"
                      name="taskId"
                      placeholder="Task ID if related to specific task"
                    />
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
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading expenses...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2" />
              <p>No expenses recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{entry.description}</h4>
                      <Badge variant="outline" className="text-xs">
                        {entry.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString()}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 