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
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Calendar,
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
import { useQuery } from "@tanstack/react-query"
import { fetchBudgets } from "@/lib/queries"

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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Budget
          </Button>
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
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Budget
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {budgets.map((budget: any) => (
                <Card key={budget.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{budget.name || 'Unnamed Project'}</h3>
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
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Budget
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Receipt className="mr-2 h-4 w-4" />
                            Add Expense
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