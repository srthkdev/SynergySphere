'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Save, 
  Target,
  Upload,
  X,
  Calendar,
  User,
  Tag,
  Image as ImageIcon,
  Flag,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadMultipleAttachments } from '@/lib/utils/file-utils';

interface ProjectData {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  managerId: string;
  deadline: string;
  imageUrl: string;
  createBudget: boolean;
  budgetAmount: number;
  budgetCurrency: string;
  imageBase64?: string;
  imageType?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    tags: [],
    managerId: '',
    deadline: '',
    imageUrl: '',
    createBudget: false,
    budgetAmount: 0,
    budgetCurrency: 'USD',
  });

  // Fetch users for project manager selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const userData = await response.json();
          setUsers(userData);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleInputChange = (field: keyof ProjectData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }
    
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      toast.error("Only JPG, PNG and GIF images are allowed.");
      return;
    }

    const uploadToastId = toast.loading("Processing image...");
    
    try {
      // Convert the file to base64 directly in the browser
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => {
        const result = reader.result as string;
        // The full data URL (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
        const dataUrl = result;
        
        // Extract just the base64 part without the prefix
        const base64Data = result.split(',')[1];
        
        // Update the form data with both the data URL and the base64 data
        setFormData(prev => ({
          ...prev,
          imageUrl: dataUrl,
          imageBase64: base64Data,
          imageType: file.type
        }));
        
        toast.success("Image processed successfully!", { id: uploadToastId });
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        toast.error("Failed to process image", { id: uploadToastId });
      };
    } catch (error: any) {
      console.error('Image processing error:', error);
      toast.error(error.message || "Image processing failed", { id: uploadToastId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setLoading(true);
    
    try {
      // Format the deadline to ISO string if it exists
      const formattedDeadline = formData.deadline ? new Date(formData.deadline).toISOString() : undefined;
      
      // Prepare project data
      const projectData: any = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        tags: formData.tags.length > 0 ? formData.tags.join(',') : undefined,
        managerId: formData.managerId || undefined,
        deadline: formattedDeadline,
        createBudget: formData.createBudget,
        budgetAmount: formData.budgetAmount,
        budgetCurrency: formData.budgetCurrency,
      };
      
      // Include image data if available
      if (formData.imageUrl) {
        projectData.imageUrl = formData.imageUrl;
        
        // If we have base64 data from our direct processing, include it
        if (formData.imageBase64 && formData.imageType) {
          projectData.imageBase64 = formData.imageBase64;
          projectData.imageType = formData.imageType;
        }
      }
      
      // Create the project first
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }

      const newProject = await response.json();

      // Create budget if requested
      if (formData.createBudget && formData.budgetAmount > 0) {
        try {
          const budgetResponse = await fetch('/api/budgets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId: newProject.id,
              totalBudget: formData.budgetAmount * 100, // Convert to cents
              currency: formData.budgetCurrency,
            }),
          });

          if (!budgetResponse.ok) {
            console.error('Failed to create budget, but project was created successfully');
            toast.warning('Project created but budget setup failed. You can set up the budget later.');
          }
        } catch (budgetError) {
          console.error('Error creating budget:', budgetError);
          toast.warning('Project created but budget setup failed. You can set up the budget later.');
        }
      }

      // Upload attachments if any
      if (newFiles.length > 0) {
        try {
          await uploadMultipleAttachments(newFiles, newProject.id);
          toast.success(`Project created successfully with ${newFiles.length} attachment(s)!`);
        } catch (attachmentError) {
          console.error('Error uploading attachments:', attachmentError);
          toast.warning('Project created but some attachments failed to upload');
        }
      } else {
        toast.success('Project created successfully!');
      }

      router.push(`/projects/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">Set up a new project with all the necessary details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="mb-1">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter project name"
                    required
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="tags" className="mb-1 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type a tag and press Enter"
                  />
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Project Manager */}
                <div>
                  <Label htmlFor="manager" className="mb-1 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Project Manager
                  </Label>
                  <Select value={formData.managerId} onValueChange={(value) => handleInputChange('managerId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Deadline */}
                <div>
                  <Label htmlFor="deadline" className="mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <Label htmlFor="image" className="mb-1 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Project Image
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                    {formData.imageUrl && (
                      <div className="flex items-center gap-2">
                        <img 
                          src={formData.imageUrl} 
                          alt="Project preview" 
                          className="h-10 w-10 rounded object-cover"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleInputChange('imageUrl', '')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="mb-1">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the project goals and objectives"
                    rows={4}
                  />
                </div>

                {/* Budget Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="createBudget"
                      checked={formData.createBudget}
                      onChange={(e) => setFormData(prev => ({ ...prev, createBudget: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createBudget" className="text-sm font-medium text-gray-700">
                      Set up project budget (optional)
                    </label>
                  </div>

                  {formData.createBudget && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                      <div>
                        <label htmlFor="budgetAmount" className="block text-sm font-medium text-gray-700 mb-1">
                          Budget Amount
                        </label>
                        <input
                          type="number"
                          id="budgetAmount"
                          min="0"
                          step="0.01"
                          value={formData.budgetAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, budgetAmount: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter budget amount"
                        />
                      </div>
                      <div>
                        <label htmlFor="budgetCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                          Currency
                        </label>
                        <select
                          id="budgetCurrency"
                          value={formData.budgetCurrency}
                          onChange={(e) => setFormData(prev => ({ ...prev, budgetCurrency: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="JPY">JPY (¥)</option>
                          <option value="CAD">CAD (C$)</option>
                          <option value="AUD">AUD (A$)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* File Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesChange={setNewFiles}
                  maxFiles={10}
                  maxSizeInMB={10}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="priority" className="mb-1">Priority</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {['low', 'medium', 'high'].map((priority) => (
                        <label key={priority} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="priority"
                            value={priority}
                            checked={formData.priority === priority}
                            onChange={(e) => handleInputChange('priority', e.target.value)}
                            className="sr-only"
                          />
                          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
                            formData.priority === priority 
                              ? getPriorityColor(priority)
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status" className="mb-1">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge className={`mt-2 ${getStatusColor(formData.status)}`}>
                    {formData.status.charAt(0).toUpperCase() + formData.status.slice(1).replace('-', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Creating...' : 'Create Project'}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
} 