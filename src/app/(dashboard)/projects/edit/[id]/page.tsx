'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { 
  ArrowLeft, 
  Save, 
  Target,
  Upload,
  X,
  Calendar,
  User,
  Tag,
  Loader2,
  Trash2,
  Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjectById, updateProject, deleteProject } from '@/lib/queries';
import { fetchAttachments, uploadMultipleAttachments, deleteAttachment } from '@/lib/utils/file-utils';
import { Attachment } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProjectData {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  priority: 'Low' | 'Medium' | 'High';
  tags: string[];
  projectManager?: string;
  deadline?: string;
  imageUrl: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  
  const [formData, setFormData] = useState<ProjectData>({
    name: '',
    description: '',
    status: 'planning',
    priority: 'Medium',
    tags: [],
    projectManager: '',
    deadline: '',
    imageUrl: '',
  });

  // Fetch project data
  const { data: project, isLoading: projectLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId,
  });

  // Fetch existing attachments
  useEffect(() => {
    const loadAttachments = async () => {
      if (!projectId) return;
      
      setAttachmentsLoading(true);
      try {
        const attachments = await fetchAttachments(projectId);
        setExistingAttachments(attachments);
      } catch (error) {
        console.error('Error fetching attachments:', error);
        toast.error('Failed to load attachments');
      } finally {
        setAttachmentsLoading(false);
      }
    };

    loadAttachments();
  }, [projectId]);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: (data: Partial<ProjectData>) => updateProject(projectId, data),
    onSuccess: () => {
      toast.success('Project updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/projects/${projectId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update project');
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      toast.success('Project deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });

  // Load project data into form when project is fetched
  useEffect(() => {
    if (project) {
      console.log('Project data loaded:', project); // Debug log
      console.log('Project status:', project.status); // Debug log
      
      // Ensure status is one of the valid values
      const validStatuses = ['planning', 'active', 'on-hold', 'completed'] as const;
      const projectStatus = validStatuses.includes(project.status as any) 
        ? project.status as 'planning' | 'active' | 'on-hold' | 'completed'
        : 'planning';
      
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: projectStatus,
        priority: project.priority || 'Medium',
        tags: Array.isArray(project.tags) ? project.tags : [],
        projectManager: project.projectManager || '',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
        imageUrl: project.imageUrl || '',
      });
    }
  }, [project]);

  // Debug effect to log formData changes
  useEffect(() => {
    console.log('FormData updated:', formData);
    console.log('FormData status:', formData.status);
  }, [formData]);

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
      const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
      if (!currentTags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...currentTags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
    setFormData(prev => ({
      ...prev,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
      toast.success('Attachment removed successfully');
    } catch (error) {
      console.error('Error removing attachment:', error);
      toast.error('Failed to remove attachment');
    }
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

    const uploadToastId = toast.loading("Uploading image...");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Image upload failed");
      }
      
      const result = await response.json();
      handleInputChange('imageUrl', result.imageUrl);
      toast.success("Image uploaded successfully!", { id: uploadToastId });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error.message || "Image upload failed", { id: uploadToastId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update the project first
      const submitData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        projectManager: formData.projectManager || undefined,
        deadline: formData.deadline || undefined,
        imageUrl: formData.imageUrl || undefined,
      };

      await updateProjectMutation.mutateAsync(submitData);

      // Upload new attachments if any
      if (newFiles.length > 0) {
        try {
          const uploadedAttachments = await uploadMultipleAttachments(newFiles, projectId);
          setExistingAttachments(prev => [...prev, ...uploadedAttachments]);
          setNewFiles([]);
          toast.success(`Project updated with ${newFiles.length} new attachment(s)!`);
        } catch (attachmentError) {
          console.error('Error uploading attachments:', attachmentError);
          toast.warning('Project updated but some attachments failed to upload');
        }
      }
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteProjectMutation.mutateAsync();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
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

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Project</h1>
          <p className="text-muted-foreground">{error?.message || 'Project not found'}</p>
          <Button className="mt-4" onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Project</h1>
          <p className="text-muted-foreground">Update project details and settings</p>
        </div>
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project
                "{project.name}" and all associated data including tasks, comments, and files.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Project'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                  {Array.isArray(formData.tags) && formData.tags.length > 0 && (
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
                  <Select value={formData.projectManager} onValueChange={(value) => handleInputChange('projectManager', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.name}>
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
                    <Upload className="h-4 w-4" />
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
              </CardContent>
            </Card>

            {/* File Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  File Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attachmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading attachments...</span>
                  </div>
                ) : (
                  <FileUpload
                    onFilesChange={setNewFiles}
                    maxFiles={10}
                    maxSizeInMB={10}
                    existingAttachments={existingAttachments}
                    onRemoveAttachment={handleRemoveAttachment}
                  />
                )}
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
                      {['Low', 'Medium', 'High'].map((priority) => (
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
                            {priority}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status" className="mb-1">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange('status', value as 'planning' | 'active' | 'on-hold' | 'completed')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project status" />
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
                    {loading ? 'Updating...' : 'Update Project'}
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