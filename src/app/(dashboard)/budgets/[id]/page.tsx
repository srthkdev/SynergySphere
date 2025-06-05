"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowLeft,
  Calendar, 
  Plus, 
  Receipt, 
  Target, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  Wallet,
  CreditCard,
  Upload,
  Filter,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

// Helper functions from budgets page
const getStatusColor = (status: string) => {
  switch (status) {
    case 'on-track':
      return 'bg-green-100 text-green-800'
    case 'over-budget':
      return 'bg-red-100 text-red-800'
    case 'under-budget':
      return 'bg-blue-100 text-blue-800'
    case 'at-risk':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'on-track':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'over-budget':
      return <AlertTriangle className="h-4 w-4 text-red-600" />
    case 'under-budget':
      return <TrendingDown className="h-4 w-4 text-blue-600" />
    case 'at-risk':
      return <Clock className="h-4 w-4 text-yellow-600" />
    default:
      return <Target className="h-4 w-4 text-gray-600" />
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return format(new Date(dateString), "MMM dd, yyyy");
}

// API functions
const fetchBudget = async (id: string) => {
  const response = await fetch(`/api/budgets/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch budget');
  }
  return response.json();
};

const fetchBudgetEntries = async (budgetId: string) => {
  const response = await fetch(`/api/budget-entries?budgetId=${budgetId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch budget entries');
  }
  return response.json();
};

const createBudgetEntry = async (data: any) => {
  const response = await fetch('/api/budget-entries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create expense');
  }
  
  return response.json();
};

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const budgetId = params.id as string;
  const queryClient = useQueryClient();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Fetch budget details
  const { 
    data: budget, 
    isLoading: isBudgetLoading, 
    error: budgetError 
  } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => fetchBudget(budgetId),
  });

  // Fetch budget entries (expenses)
  const { 
    data: entries = [], 
    isLoading: isEntriesLoading, 
    error: entriesError 
  } = useQuery({
    queryKey: ['budgetEntries', budgetId],
    queryFn: () => fetchBudgetEntries(budgetId),
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: createBudgetEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetEntries', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      setIsAddExpenseOpen(false);
      toast.success('Expense added successfully');
      
      // Reset form state
      setStartDate(undefined);
      setEndDate(undefined);
      setPreviewImage(null);
    },
    onError: (error) => {
      toast.error(`Failed to add expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const handleCreateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get('name') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    
    if (!name) {
      toast.error('Name is required');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (!description) {
      toast.error('Description is required');
      return;
    }

    // Convert amount to cents for the backend
    const amountInCents = Math.round(amount * 100);
    
    // Prepare expense data
    const expenseData: any = {
      budgetId,
      name,
      amount: amountInCents,
      description,
      category: 'general', // Default category
    };

    // Add dates if provided
    if (startDate) {
      expenseData.startDate = startDate.toISOString();
    }
    if (endDate) {
      expenseData.endDate = endDate.toISOString();
    }

    // Add image if uploaded
    if (previewImage) {
      // Extract base64 data and mime type from data URL
      const match = previewImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const [, mime, base64Data] = match;
        expenseData.imageBase64 = base64Data;
        expenseData.imageType = mime;
      }
    }
    
    createExpenseMutation.mutate(expenseData);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // File size validation (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter entries based on search term and category
  const filteredEntries = entries.filter((entry: any) => {
    const matchesSearch = 
      (entry.name && entry.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                            (entry.category && entry.category === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Calculate summary stats
  const totalExpenses = filteredEntries.length;
  const totalAmount = filteredEntries.reduce((sum: number, entry: any) => sum + entry.amount, 0);
  const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;
  const largestExpense = filteredEntries.length > 0 
    ? Math.max(...filteredEntries.map((entry: any) => entry.amount)) 
    : 0;

  if (isBudgetLoading || isEntriesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (budgetError || entriesError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Budget</h1>
          <p className="text-muted-foreground">
            {budgetError ? (budgetError as Error).message : (entriesError as Error).message}
          </p>
          <Button asChild className="mt-4">
            <Link href="/budgets">Back to Budgets</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.push('/budgets')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Budgets
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{budget.name}</h1>
          <p className="text-muted-foreground">
            Budget Details and Expenses
          </p>
        </div>
      </div>

      {/* Budget Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              {budget.imageBase64 && budget.imageType && (
                <div className="rounded-lg overflow-hidden mb-4">
                  <img 
                    src={`data:${budget.imageType};base64,${budget.imageBase64}`}
                    alt={budget.name}
                    className="w-full h-auto object-cover max-h-[200px]"
                  />
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Budget Details</h3>
                  {budget.description && (
                    <p className="text-muted-foreground mt-2">{budget.description}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{budget.currency}</Badge>
                  <Badge className={getStatusColor(budget.status)}>
                    {getStatusIcon(budget.status)}
                    <span className="ml-1 capitalize">{budget.status.replace('-', ' ')}</span>
                  </Badge>
                </div>
                
                {(budget.startDate || budget.endDate) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Budget Period</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {budget.startDate && budget.endDate ? (
                        <span>{formatDate(budget.startDate)} - {formatDate(budget.endDate)}</span>
                      ) : budget.startDate ? (
                        <span>From {formatDate(budget.startDate)}</span>
                      ) : budget.endDate ? (
                        <span>Until {formatDate(budget.endDate)}</span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:w-2/3 space-y-6">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(budget.totalBudget)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Spent</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(budget.spentAmount)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${budget.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(budget.totalBudget - budget.spentAmount)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Budget utilization</span>
                  <span>{Math.round((budget.spentAmount / budget.totalBudget) * 100)}%</span>
                </div>
                <Progress 
                  value={Math.min(Math.round((budget.spentAmount / budget.totalBudget) * 100), 100)} 
                  className={budget.spentAmount > budget.totalBudget ? 'bg-red-100' : ''}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">
            Track and manage your budget expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Expense Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter expense name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Budget Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-8"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        if (dateValue) {
                          setStartDate(new Date(dateValue));
                        } else {
                          setStartDate(undefined);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input 
                      id="endDate" 
                      type="date" 
                      value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        if (dateValue) {
                          setEndDate(new Date(dateValue));
                        } else {
                          setEndDate(undefined);
                        }
                      }}
                      min={startDate ? format(startDate, "yyyy-MM-dd") : undefined}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Expense Image</Label>
                  <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {previewImage ? (
                      <div className="relative w-full">
                        <img 
                          src={previewImage} 
                          alt="Expense preview" 
                          className="mx-auto max-h-32 object-contain rounded" 
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="absolute top-0 right-0 h-8 w-8 p-0 rounded-full z-10"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent onClick
                            handleRemoveImage();
                          }}
                        >
                          &times;
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or GIF (Max 2MB)
                        </p>
                      </>
                    )}
                    <Input
                      ref={fileInputRef}
                      type="file"
                      name="image"
                      className="hidden"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter expense description"
                    rows={3}
                    required
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddExpenseOpen(false)}
                    className="mt-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createExpenseMutation.isPending}
                    className="mt-2"
                  >
                    {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Filters and search */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search expenses..." 
                className="pl-8 w-full md:w-[250px]" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </Card>
      )}
      
      {/* Expense Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses}</div>
            <p className="text-xs text-muted-foreground">
              Expenses tracked in this budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Sum of all expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageExpense)}</div>
            <p className="text-xs text-muted-foreground">
              Average expense amount
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Expense</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(largestExpense)}</div>
            <p className="text-xs text-muted-foreground">
              Highest expense amount
            </p>
          </CardContent>
        </Card>
      </div>

      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
            <p className="text-muted-foreground mb-4">
              {entries.length === 0
                ? "Add your first expense to start tracking your budget."
                : "No expenses match your current filter criteria."
              }
            </p>
            <Button onClick={() => setIsAddExpenseOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Tabs defaultValue="all" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Expenses</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="largest">Largest</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search expenses..." 
                      className="pl-8 w-[250px]" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEntries.map((entry: any) => (
                  <Card key={entry.id} className="flex flex-col h-full hover:shadow-md transition-shadow hover:border-primary cursor-pointer">
                    {entry.imageBase64 && entry.imageType && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <img 
                          src={`data:${entry.imageType};base64,${entry.imageBase64}`}
                          alt={entry.name || "Expense"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className={`p-5 flex flex-col flex-grow ${!entry.imageBase64 && 'h-full'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-lg truncate group-hover:text-primary">{entry.name || entry.description}</div>
                        <Badge variant="outline" className="ml-2 font-semibold whitespace-nowrap">
                          {formatCurrency(entry.amount)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm mb-4 flex-grow">
                        <p className="line-clamp-3 text-muted-foreground">{entry.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-auto border-t pt-3">
                        {(entry.startDate || entry.endDate) && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {entry.startDate && entry.endDate ? (
                              <span>{formatDate(entry.startDate)} - {formatDate(entry.endDate)}</span>
                            ) : entry.startDate ? (
                              <span>From {formatDate(entry.startDate)}</span>
                            ) : entry.endDate ? (
                              <span>Until {formatDate(entry.endDate)}</span>
                            ) : null}
                          </div>
                        )}
                        <div className="flex items-center ml-auto">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(entry.createdAt), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="recent" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEntries
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 9)
                  .map((entry: any) => (
                    <Card key={entry.id} className="flex flex-col h-full hover:shadow-md transition-shadow hover:border-primary cursor-pointer">
                      {entry.imageBase64 && entry.imageType && (
                        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                          <img 
                            src={`data:${entry.imageType};base64,${entry.imageBase64}`}
                            alt={entry.name || "Expense"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className={`p-5 flex flex-col flex-grow ${!entry.imageBase64 && 'h-full'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-lg truncate group-hover:text-primary">{entry.name || entry.description}</div>
                          <Badge variant="outline" className="ml-2 font-semibold whitespace-nowrap">
                            {formatCurrency(entry.amount)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm mb-4 flex-grow">
                          <p className="line-clamp-3 text-muted-foreground">{entry.description}</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-auto border-t pt-3">
                          {(entry.startDate || entry.endDate) && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {entry.startDate && entry.endDate ? (
                                <span>{formatDate(entry.startDate)} - {formatDate(entry.endDate)}</span>
                              ) : entry.startDate ? (
                                <span>From {formatDate(entry.startDate)}</span>
                              ) : entry.endDate ? (
                                <span>Until {formatDate(entry.endDate)}</span>
                              ) : null}
                            </div>
                          )}
                          <div className="flex items-center ml-auto">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(entry.createdAt), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="largest" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEntries
                  .sort((a: any, b: any) => b.amount - a.amount)
                  .slice(0, 9)
                  .map((entry: any) => (
                    <Card key={entry.id} className="flex flex-col h-full hover:shadow-md transition-shadow hover:border-primary cursor-pointer">
                      {entry.imageBase64 && entry.imageType && (
                        <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                          <img 
                            src={`data:${entry.imageType};base64,${entry.imageBase64}`}
                            alt={entry.name || "Expense"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className={`p-5 flex flex-col flex-grow ${!entry.imageBase64 && 'h-full'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-lg truncate group-hover:text-primary">{entry.name || entry.description}</div>
                          <Badge variant="outline" className="ml-2 font-semibold whitespace-nowrap">
                            {formatCurrency(entry.amount)}
                          </Badge>
                        </div>
                        
                        <div className="text-sm mb-4 flex-grow">
                          <p className="line-clamp-3 text-muted-foreground">{entry.description}</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-auto border-t pt-3">
                          {(entry.startDate || entry.endDate) && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {entry.startDate && entry.endDate ? (
                                <span>{formatDate(entry.startDate)} - {formatDate(entry.endDate)}</span>
                              ) : entry.startDate ? (
                                <span>From {formatDate(entry.startDate)}</span>
                              ) : entry.endDate ? (
                                <span>Until {formatDate(entry.endDate)}</span>
                              ) : null}
                            </div>
                          )}
                          <div className="flex items-center ml-auto">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(entry.createdAt), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}