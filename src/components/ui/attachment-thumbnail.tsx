"use client";

import React from "react";
import { Attachment } from "@/types";
import { File, Image, FileText, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFileSize, isImageFile, createImageThumbnail } from "@/lib/utils/file-utils";

interface AttachmentThumbnailProps {
  attachment: Attachment;
  size?: "sm" | "md" | "lg";
  showFileName?: boolean;
  className?: string;
}

export function AttachmentThumbnail({
  attachment,
  size = "sm",
  showFileName = false,
  className = "",
}: AttachmentThumbnailProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const getFileIcon = () => {
    if (isImageFile(attachment.fileType)) {
      return <Image className={`${sizeClasses[size]} text-blue-500`} />;
    } else if (attachment.fileType === "application/pdf") {
      return <FileText className={`${sizeClasses[size]} text-red-500`} />;
    } else if (attachment.fileName.toLowerCase().includes(".doc")) {
      return <FileText className={`${sizeClasses[size]} text-blue-600`} />;
    }
    return <File className={`${sizeClasses[size]} text-gray-500`} />;
  };

  const renderThumbnail = () => {
    if (isImageFile(attachment.fileType)) {
      return (
        <img
          src={createImageThumbnail(attachment.base64Data, attachment.fileType)}
          alt={attachment.fileName}
          className={`${sizeClasses[size]} object-cover rounded`}
        />
      );
    }
    return getFileIcon();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {renderThumbnail()}
      {showFileName && (
        <div className="flex flex-col">
          <span className="text-xs text-gray-600 truncate max-w-[100px]" title={attachment.fileName}>
            {attachment.fileName}
          </span>
          <span className="text-xs text-gray-400">
            {formatFileSize(attachment.fileSize)}
          </span>
        </div>
      )}
    </div>
  );
}

interface AttachmentCountProps {
  count: number;
  className?: string;
}

export function AttachmentCount({ count, className = "" }: AttachmentCountProps) {
  if (count === 0) return null;

  return (
    <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
      <Paperclip className="w-3 h-3" />
      {count}
    </Badge>
  );
} 