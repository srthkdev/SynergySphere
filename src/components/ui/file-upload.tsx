"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, File, Image, FileText } from "lucide-react";
import { toast } from "sonner";
import { Attachment } from "@/types";

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  existingAttachments?: Attachment[];
  onRemoveAttachment?: (attachmentId: string) => void;
}

export function FileUpload({
  onFilesChange,
  maxFiles = 5,
  maxSizeInMB = 10,
  acceptedTypes = ["image/*", "application/pdf", ".doc", ".docx", ".txt"],
  existingAttachments = [],
  onRemoveAttachment,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      // Check file size
      if (file.size > maxSizeInMB * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxSizeInMB}MB.`);
        continue;
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.includes("*")) {
          return file.type.startsWith(type.replace("*", ""));
        }
        return file.type === type || file.name.toLowerCase().endsWith(type);
      });

      if (!isValidType) {
        toast.error(`File ${file.name} is not a supported file type.`);
        continue;
      }

      validFiles.push(file);
    }

    // Check total file count
    const totalFiles = files.length + validFiles.length + existingAttachments.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (fileType === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileName.toLowerCase().includes(".doc")) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderThumbnail = (file: File) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      return (
        <img
          src={url}
          alt={file.name}
          className="w-16 h-16 object-cover rounded"
          onLoad={() => URL.revokeObjectURL(url)}
        />
      );
    }
    return (
      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
        {getFileIcon(file.type, file.name)}
      </div>
    );
  };

  const renderAttachmentThumbnail = (attachment: Attachment) => {
    if (attachment.fileType.startsWith("image/")) {
      return (
        <img
          src={`data:${attachment.fileType};base64,${attachment.base64Data}`}
          alt={attachment.fileName}
          className="w-16 h-16 object-cover rounded"
        />
      );
    }
    return (
      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
        {getFileIcon(attachment.fileType, attachment.fileName)}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop files here, or{" "}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-500 font-medium"
            onClick={() => fileInputRef.current?.click()}
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">
          Maximum {maxFiles} files, {maxSizeInMB}MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Attachments</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingAttachments.map((attachment) => (
              <Card key={attachment.id} className="relative">
                <CardContent className="p-3">
                  {renderAttachmentThumbnail(attachment)}
                  <p className="text-xs text-gray-600 mt-2 truncate" title={attachment.fileName}>
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                  {onRemoveAttachment && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => onRemoveAttachment(attachment.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* New Files */}
      {files.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">New Files</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-3">
                  {renderThumbnail(file)}
                  <p className="text-xs text-gray-600 mt-2 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 