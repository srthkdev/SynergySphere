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
  Eye
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const budgets = [
  {
    id: 1,
    name: "Website Redesign",
    allocated: 50000,
    spent: 32500,
    remaining: 17500,
    status: "on-track",
    category: "Development",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    owner: "Alice Johnson"
  },
  {
    id: 2,
    name: "Marketing Campaign Q1",
    allocated: 25000,
    spent: 28000,
    remaining: -3000,
    status: "over-budget",
    category: "Marketing",
    startDate: "2024-01-01",
    endDate: "2024-03-31",
    owner: "Eve Brown"
  },
  {
    id: 3,
    name: "Mobile App Development",
    allocated: 75000,
    spent: 45000,
    remaining: 30000,
    status: "on-track",
    category: "Development",
    startDate: "2024-02-01",
    endDate: "2024-06-30",
    owner: "Bob Smith"
  },
  {
    id: 4,
    name: "Office Equipment",
    allocated: 15000,
    spent: 8500,
    remaining: 6500,
    status: "under-budget",
    category: "Operations",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    owner: "David Wilson"
  }
]

const expenses = [
  {
    id: 1,
    description: "UI/UX Design Tools License",
    amount: 2500,
    category: "Software",
    budget: "Website Redesign",
    date: "2024-01-15",
    vendor: "Adobe Creative Suite",
    status: "approved"
  },
  {
    id: 2,
    description: "Google Ads Campaign",
    amount: 5000,
    category: "Advertising",
    budget: "Marketing Campaign Q1",
    date: "2024-01-14",
    vendor: "Google Ads",
    status: "approved"
  },
  {
    id: 3,
    description: "Development Server Hosting",
    amount: 1200,
    category: "Infrastructure",
    budget: "Mobile App Development",
    date: "2024-01-13",
    vendor: "AWS",
    status: "pending"
  },
  {
    id: 4,
    description: "Standing Desks",
    amount: 3500,
    category: "Furniture",
    budget: "Office Equipment",
    date: "2024-01-12",
    vendor: "Office Depot",
    status: "approved"
  }
]

const categories = [
  { name: "Development", budget: 125000, spent: 77500, color: "bg-blue-100 text-blue-800" },
  { name: "Marketing", budget: 25000, spent: 28000, color: "bg-green-100 text-green-800" },
  { name: "Operations", budget: 15000, spent: 8500, color: "bg-purple-100 text-purple-800" },
  { name: "Infrastructure", budget: 10000, spent: 1200, color: "bg-orange-100 text-orange-800" }
]

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
  const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const totalRemaining = totalAllocated - totalSpent
  const overBudgetCount = budgets.filter(b => b.status === 'over-budget').length

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
              {Math.round((totalSpent / totalAllocated) * 100)}% of total budget
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
          <div className="grid gap-4">
            {budgets.map((budget) => (
              <Card key={budget.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{budget.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{budget.category}</Badge>
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
                      <span>{Math.round((budget.spent / budget.allocated) * 100)}%</span>
                    </div>
                    <Progress 
                      value={Math.min((budget.spent / budget.allocated) * 100, 100)} 
                      className={budget.spent > budget.allocated ? 'bg-red-100' : ''}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                    <span>Owner: {budget.owner}</span>
                    <span>
                      {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="space-y-2">
            {expenses.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{expense.description}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>{expense.vendor}</span>
                        <span>•</span>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <Badge variant="outline">{expense.category}</Badge>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-lg font-semibold">{formatCurrency(expense.amount)}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={expense.status === 'approved' ? 'default' : 'secondary'}>
                          {expense.status}
                        </Badge>
                        <Badge variant="outline">{expense.budget}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <Card key={category.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {category.name}
                    <Badge className={category.color}>
                      {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Budget utilization</span>
                      <span>{Math.round((category.spent / category.budget) * 100)}%</span>
                    </div>
                    <Progress 
                      value={Math.min((category.spent / category.budget) * 100, 100)}
                      className={category.spent > category.budget ? 'bg-red-100' : ''}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Allocated</p>
                      <p className="font-semibold">{formatCurrency(category.budget)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className={`font-semibold ${category.budget - category.spent < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(category.budget - category.spent)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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