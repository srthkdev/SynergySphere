"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Download,
  Upload,
  Search,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Wallet,
  Receipt,
  Target,
  Edit,
  Trash2,
  Eye,
  Loader2
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchBudgets, createBudget, fetchProjects } from "@/lib/queries"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

export default function BudgetsPage() {
  const { data: budgets = [], isLoading, error } = useQuery({
    queryKey: ['budgets'],
    queryFn: fetchBudgets,
  });
  
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
  
  const [isCreateBudgetOpen, setIsCreateBudgetOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  
  // Function to navigate to budget detail page
  const handleBudgetClick = (budgetId: string, e: React.MouseEvent) => {
    // Check if the click is from a button or dropdown
    if (
      e.target instanceof HTMLElement && 
      (e.target.closest('button') || e.target.closest('.dropdown-menu'))
    ) {
      return;
    }
    
    router.push(`/budgets/${budgetId}`);
  };
  
  // Mutation for creating a budget
  const createBudgetMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      setIsCreateBudgetOpen(false);
      toast.success('Budget created successfully');
      
      // Reset form state
      setStartDate(undefined);
      setEndDate(undefined);
      setPreviewImage(null);
      setSelectedProjectId(null);
    },
    onError: (error) => {
      toast.error(`Failed to create budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  const handleCreateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const projectId = formData.get('projectId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const totalBudget = parseFloat(formData.get('totalBudget') as string);
    const currency = formData.get('currency') as string;

    if (!projectId) {
      toast.error('Please select a project');
      return;
    }

    if (!name) {
      toast.error('Budget name is required');
      return;
    }

    if (isNaN(totalBudget) || totalBudget <= 0) {
      toast.error('Budget amount must be greater than 0');
      return;
    }

    // Prepare budget data
    const budgetData: any = { 
      projectId, 
      name,
      description: description || undefined,
      totalBudget, 
      currency: currency || 'USD',
    };

    // Add dates if provided
    if (startDate) {
      budgetData.startDate = startDate.toISOString();
    }
    if (endDate) {
      budgetData.endDate = endDate.toISOString();
    }

    // Add image if uploaded
    if (previewImage) {
      // Extract base64 data and mime type from data URL
      const match = previewImage.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const [, mime, base64Data] = match;
        budgetData.imageBase64 = base64Data;
        budgetData.imageType = mime;
      }
    }

    createBudgetMutation.mutate(budgetData);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Budgets</h1>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const totalAllocated = budgets.reduce((sum: number, budget: any) => sum + budget.allocated, 0)
  const totalSpent = budgets.reduce((sum: number, budget: any) => sum + budget.spent, 0)
  const totalRemaining = totalAllocated - totalSpent
  const overBudgetCount = budgets.filter((b: any) => b.status === 'over-budget').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">
            Track and manage project budgets and expenses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateBudgetOpen} onOpenChange={setIsCreateBudgetOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project</Label>
                  <Select name="projectId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project: any) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Budget Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter budget name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter budget description"
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="totalBudget">Budget Amount</Label>
                    <Input
                      id="totalBudget"
                      name="totalBudget"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div className="space-y-2">
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
                  <Label>Budget Image</Label>
                  <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {previewImage ? (
                      <div className="relative w-full">
                        <img 
                          src={previewImage} 
                          alt="Budget preview" 
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
                      className="hidden" // Hide completely instead of using opacity
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateBudgetOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBudgetMutation.isPending}
                  >
                    {createBudgetMutation.isPending ? 'Creating...' : 'Create Budget'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAllocated)}</div>
            <p className="text-xs text-muted-foreground">
              Across {budgets.length} budgets
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0}% of total budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRemaining)}</div>
            <p className="text-xs text-muted-foreground">
              Available to spend
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overBudgetCount}</div>
            <p className="text-xs text-muted-foreground">
              {overBudgetCount === 0 ? 'All on track' : 'Need attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="budgets" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="budgets">Project Budgets</TabsTrigger>
            <TabsTrigger value="expenses">Recent Expenses</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search budgets..." className="pl-8 w-[250px]" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="on-track">On Track</SelectItem>
                <SelectItem value="over-budget">Over Budget</SelectItem>
                <SelectItem value="under-budget">Under Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="budgets" className="space-y-4">
          {budgets.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No budgets found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first project budget to start tracking expenses.
                </p>
                <Dialog open={isCreateBudgetOpen} onOpenChange={setIsCreateBudgetOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Budget
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {budgets.map((budget: any) => (
                <Card 
                  key={budget.id} 
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={(e) => handleBudgetClick(budget.id, e)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">
                          <Link href={`/budgets/${budget.id}`} className="hover:underline">
                            {budget.name || 'Unnamed Project'}
                          </Link>
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{budget.currency}</Badge>
                          <Badge className={getStatusColor(budget.status)}>
                            {getStatusIcon(budget.status)}
                            <span className="ml-1 capitalize">{budget.status.replace('-', ' ')}</span>
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/budgets/${budget.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Budget
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/budgets/${budget.id}`}>
                              <Receipt className="mr-2 h-4 w-4" />
                              Add Expense
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mb-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Allocated</p>
                        <p className="text-xl font-semibold">{formatCurrency(budget.allocated)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="text-xl font-semibold">{formatCurrency(budget.spent)}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className={`text-xl font-semibold ${budget.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(budget.remaining)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Budget utilization</span>
                        <span>{budget.utilizationPercent}%</span>
                      </div>
                      <Progress 
                        value={Math.min(budget.utilizationPercent, 100)} 
                        className={budget.spent > budget.allocated ? 'bg-red-100' : ''}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <span>Project ID: {budget.projectId}</span>
                      <span>
                        Created: {new Date(budget.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Expense tracking coming soon</h3>
              <p className="text-muted-foreground">
                Individual expense entries will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Category analytics coming soon</h3>
              <p className="text-muted-foreground">
                Budget categorization and analytics will be available in the next update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending Trend</CardTitle>
                <CardDescription>
                  Monthly spending across all budgets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Spending trend chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Budget Distribution</CardTitle>
                <CardDescription>
                  Budget allocation by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded">
                  <div className="text-center">
                    <PieChart className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Budget distribution chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 