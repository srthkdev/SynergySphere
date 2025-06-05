"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Paperclip, 
  Download, 
  Trash2, 
  Eye, 
  Upload,
  Loader2,
  File,
  Image,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { Attachment } from "@/types";
import { fetchAttachments, deleteAttachment } from "@/lib/utils/file-utils";
import { AttachmentThumbnail } from "@/components/ui/attachment-thumbnail";
import { FileUpload } from "@/components/ui/file-upload";
import { uploadMultipleAttachments } from "@/lib/utils/file-utils";
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

interface AttachmentsTabProps {
  projectId: string;
}

export function AttachmentsTab({ projectId }: AttachmentsTabProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  // Fetch attachments
  useEffect(() => {
    const loadAttachments = async () => {
      try {
        const data = await fetchAttachments(projectId);
        setAttachments(data);
      } catch (error) {
        console.error('Error fetching attachments:', error);
        toast.error('Failed to load attachments');
      } finally {
        setLoading(false);
      }
    };

    loadAttachments();
  }, [projectId]);

  const handleUpload = async () => {
    if (newFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadedAttachments = await uploadMultipleAttachments(newFiles, projectId);
      setAttachments(prev => [...prev, ...uploadedAttachments]);
      setNewFiles([]);
      setShowUpload(false);
      toast.success(`${uploadedAttachments.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      toast.success('Attachment deleted successfully');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = `data:${attachment.fileType};base64,${attachment.base64Data}`;
    link.download = attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (attachment: Attachment) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>${attachment.fileName}</title></head>
          <body style="margin:0;padding:20px;background:#f5f5f5;">
            <div style="text-align:center;">
              <h3>${attachment.fileName}</h3>
              ${attachment.fileType.startsWith('image/') 
                ? `<img src="data:${attachment.fileType};base64,${attachment.base64Data}" style="max-width:100%;height:auto;" />`
                : `<p>File type: ${attachment.fileType}</p><p>Size: ${(attachment.fileSize / 1024).toFixed(2)} KB</p>`
              }
            </div>
          </body>
        </html>
      `);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('document') || fileType.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading attachments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Project Attachments</h2>
          <Badge variant="secondary">{attachments.length}</Badge>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onFilesChange={setNewFiles}
              maxFiles={10}
              maxSizeInMB={10}
            />
            {newFiles.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {newFiles.length} file(s)
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setNewFiles([])}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments Grid */}
      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {attachments.map((attachment) => (
            <Card key={attachment.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Thumbnail */}
                  <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg">
                    <AttachmentThumbnail 
                      attachment={attachment} 
                      size="lg" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* File Info */}
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm truncate" title={attachment.fileName}>
                      {attachment.fileName}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getFileTypeIcon(attachment.fileType)}
                      <span>{formatFileSize(attachment.fileSize)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(attachment.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(attachment)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(attachment)}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{attachment.fileName}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(attachment.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Paperclip className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No attachments yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload files to share with your team members
            </p>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 