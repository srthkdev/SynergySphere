"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AttachmentViewerProps {
  url: string;
  alt?: string;
  className?: string;
}

export function AttachmentViewer({ url, alt = "Attachment", className = "" }: AttachmentViewerProps) {
  const [fullUrl, setFullUrl] = useState<string>(url);
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Make sure we have a complete URL with origin if it's a relative path
    if (url && typeof window !== "undefined" && !url.startsWith("http")) {
      setFullUrl(`${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`);
    } else {
      setFullUrl(url);
    }
  }, [url]);

  // Detect file type based on extension
  const fileExtension = url.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);

  if (hasError || !isImage) {
    return (
      <div className="flex items-center justify-center p-4 border rounded-md bg-muted/20">
        <a 
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
          {isImage ? 'View Image' : 'Download Attachment'}
        </a>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`cursor-pointer border rounded-md overflow-hidden bg-muted/10 hover:bg-muted/5 transition-colors ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <img 
          src={fullUrl} 
          alt={alt} 
          className="w-full object-contain max-h-60"
          onError={() => setHasError(true)}
        />
        <div className="p-1 text-center text-xs text-muted-foreground">
          Click to enlarge
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
          <div className="bg-white/10 backdrop-blur-sm p-1 rounded-lg">
            <img 
              src={fullUrl}
              alt={alt}
              className="w-auto max-h-[80vh] max-w-full object-contain rounded"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 