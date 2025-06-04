import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Shield,
  Crown,
  Star
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const teamMembers = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.johnson@company.com",
    role: "Project Manager",
    department: "Engineering",
    status: "active",
    avatar: "/avatars/alice.jpg",
    joinDate: "2023-01-15",
    location: "New York, NY",
    phone: "+1 (555) 123-4567",
    tasksCompleted: 142,
    activeProjects: 3,
    permissions: "admin"
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob.smith@company.com",
    role: "Senior Developer",
    department: "Engineering",
    status: "active",
    avatar: "/avatars/bob.jpg",
    joinDate: "2022-11-08",
    location: "San Francisco, CA",
    phone: "+1 (555) 234-5678",
    tasksCompleted: 98,
    activeProjects: 2,
    permissions: "member"
  },
  {
    id: 3,
    name: "Carol Davis",
    email: "carol.davis@company.com",
    role: "UI/UX Designer",
    department: "Design",
    status: "active",
    avatar: "/avatars/carol.jpg",
    joinDate: "2023-03-22",
    location: "Austin, TX",
    phone: "+1 (555) 345-6789",
    tasksCompleted: 76,
    activeProjects: 4,
    permissions: "member"
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david.wilson@company.com",
    role: "Data Analyst",
    department: "Analytics",
    status: "inactive",
    avatar: "/avatars/david.jpg",
    joinDate: "2022-08-12",
    location: "Chicago, IL",
    phone: "+1 (555) 456-7890",
    tasksCompleted: 54,
    activeProjects: 1,
    permissions: "member"
  },
  {
    id: 5,
    name: "Eve Brown",
    email: "eve.brown@company.com",
    role: "Marketing Specialist",
    department: "Marketing",
    status: "active",
    avatar: "/avatars/eve.jpg",
    joinDate: "2023-05-10",
    location: "Los Angeles, CA",
    phone: "+1 (555) 567-8901",
    tasksCompleted: 89,
    activeProjects: 2,
    permissions: "member"
  }
]

const departments = [
  { name: "Engineering", count: 8, color: "bg-blue-100 text-blue-800" },
  { name: "Design", count: 4, color: "bg-purple-100 text-purple-800" },
  { name: "Marketing", count: 6, color: "bg-green-100 text-green-800" },
  { name: "Analytics", count: 3, color: "bg-orange-100 text-orange-800" },
  { name: "Sales", count: 5, color: "bg-red-100 text-red-800" }
]

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members, roles, and permissions
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((teamMembers.filter(m => m.status === 'active').length / teamMembers.length) * 100)}% active rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Tasks/Member</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teamMembers.reduce((acc, m) => acc + m.tasksCompleted, 0) / teamMembers.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per team member
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search team members..." className="pl-8" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          {/* Team Members Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{member.name}</CardTitle>
                        <CardDescription>{member.role}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                      {member.status}
                    </Badge>
                    <Badge variant="outline" className={departments.find(d => d.name === member.department)?.color}>
                      {member.department}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3 w-3" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span>{member.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{member.tasksCompleted}</div>
                      <div className="text-xs text-muted-foreground">Tasks Done</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold">{member.activeProjects}</div>
                      <div className="text-xs text-muted-foreground">Active Projects</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center pt-2">
                    {member.permissions === 'admin' && (
                      <Badge variant="destructive" className="text-xs">
                        <Crown className="mr-1 h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                    {member.permissions === 'member' && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="mr-1 h-3 w-3" />
                        Member
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <Card key={dept.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {dept.name}
                    <Badge className={dept.color}>{dept.count} members</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Team members in this department
                    </div>
                    <div className="flex -space-x-2">
                      {teamMembers
                        .filter(m => m.department === dept.name)
                        .slice(0, 5)
                        .map((member) => (
                          <Avatar key={member.id} className="border-2 border-background h-8 w-8">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      {teamMembers.filter(m => m.department === dept.name).length > 5 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                          +{teamMembers.filter(m => m.department === dept.name).length - 5}
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Department
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Management</CardTitle>
              <CardDescription>
                Manage user roles and access permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.permissions === 'admin' ? 'destructive' : 'secondary'}>
                        {member.permissions === 'admin' ? (
                          <>
                            <Crown className="mr-1 h-3 w-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <Shield className="mr-1 h-3 w-3" />
                            Member
                          </>
                        )}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Change Role
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 