import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  File,
  FileText,
  Image,
  Video,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Share,
  Trash2,
  Edit,
  FolderOpen,
  Plus,
  Grid3X3,
  List,
  Calendar,
  User,
  Clock,
  Star,
  Paperclip
} from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const documents = [
  {
    id: 1,
    name: "Project Requirements.pdf",
    type: "pdf",
    size: "2.4 MB",
    modifiedDate: "2024-01-15",
    modifiedBy: "Alice Johnson",
    tags: ["requirements", "project"],
    isStarred: true,
    thumbnail: "/doc-thumbnails/pdf.png"
  },
  {
    id: 2,
    name: "Design Mockups.fig",
    type: "figma",
    size: "15.8 MB",
    modifiedDate: "2024-01-14",
    modifiedBy: "Carol Davis",
    tags: ["design", "mockups"],
    isStarred: false,
    thumbnail: "/doc-thumbnails/figma.png"
  },
  {
    id: 3,
    name: "Team Meeting Notes.docx",
    type: "word",
    size: "1.2 MB",
    modifiedDate: "2024-01-14",
    modifiedBy: "Bob Smith",
    tags: ["meeting", "notes"],
    isStarred: true,
    thumbnail: "/doc-thumbnails/word.png"
  },
  {
    id: 4,
    name: "Budget Analysis.xlsx",
    type: "excel",
    size: "3.1 MB",
    modifiedDate: "2024-01-13",
    modifiedBy: "David Wilson",
    tags: ["budget", "analysis"],
    isStarred: false,
    thumbnail: "/doc-thumbnails/excel.png"
  },
  {
    id: 5,
    name: "Presentation Draft.pptx",
    type: "powerpoint",
    size: "12.5 MB",
    modifiedDate: "2024-01-12",
    modifiedBy: "Eve Brown",
    tags: ["presentation", "draft"],
    isStarred: false,
    thumbnail: "/doc-thumbnails/powerpoint.png"
  },
  {
    id: 6,
    name: "User Research Data.csv",
    type: "csv",
    size: "856 KB",
    modifiedDate: "2024-01-11",
    modifiedBy: "Alice Johnson",
    tags: ["research", "data"],
    isStarred: true,
    thumbnail: "/doc-thumbnails/csv.png"
  }
]

const folders = [
  { id: 1, name: "Project Documentation", count: 12, modifiedDate: "2024-01-15" },
  { id: 2, name: "Design Assets", count: 28, modifiedDate: "2024-01-14" },
  { id: 3, name: "Meeting Records", count: 7, modifiedDate: "2024-01-13" },
  { id: 4, name: "Templates", count: 15, modifiedDate: "2024-01-10" }
]

const recentDocuments = documents.slice(0, 3)
const starredDocuments = documents.filter(doc => doc.isStarred)

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-8 w-8 text-red-600" />
    case 'word':
      return <FileText className="h-8 w-8 text-blue-600" />
    case 'excel':
      return <FileText className="h-8 w-8 text-green-600" />
    case 'powerpoint':
      return <FileText className="h-8 w-8 text-orange-600" />
    case 'figma':
      return <FileText className="h-8 w-8 text-purple-600" />
    case 'csv':
      return <FileText className="h-8 w-8 text-gray-600" />
    default:
      return <File className="h-8 w-8 text-gray-500" />
  }
}

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage and collaborate on your team documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              +3 from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1 GB</div>
            <p className="text-xs text-muted-foreground">
              of 10 GB available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Documents</CardTitle>
            <Share className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Across 8 projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Files modified today
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="folders">Folders</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search documents..." className="pl-8 w-[300px]" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="word">Word</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {getFileIcon(doc.type)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                        {doc.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.size}</p>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(doc.modifiedDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {doc.modifiedBy.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{doc.modifiedBy}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.type)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-1">
                        <h3 className="font-medium text-sm">{doc.name}</h3>
                        {doc.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Modified {new Date(doc.modifiedDate).toLocaleDateString()} by {doc.modifiedBy}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="starred" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {starredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.type)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-1">
                        <h3 className="font-medium text-sm">{doc.name}</h3>
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {doc.size} • {new Date(doc.modifiedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder) => (
              <Card key={folder.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FolderOpen className="h-8 w-8 text-blue-600" />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm">{folder.name}</h3>
                      <p className="text-xs text-muted-foreground">{folder.count} items</p>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Modified {new Date(folder.modifiedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 