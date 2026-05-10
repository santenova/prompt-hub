import React, { useState } from "react";
import { Paperclip, X, FileText, File, Image as ImageIcon, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FileUpload({ attachedFiles, onFilesChange }) {
  const fileInputRef = React.useRef(null);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-4 h-4" />;
    } else if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json'].includes(ext)) {
      return <Code className="w-4 h-4" />;
    } else if (['txt', 'md', 'pdf', 'doc', 'docx'].includes(ext)) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesChange([...attachedFiles, ...files]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    onFilesChange(attachedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".txt,.md,.pdf,.doc,.docx,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.jpg,.jpeg,.png,.gif,.webp,.svg"
      />
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Attach files (documents, code, images)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap max-w-md">
          {attachedFiles.map((file, index) => (
            <Badge
              key={index}
              variant="outline"
              className="flex items-center gap-1 px-2 py-1"
            >
              {getFileIcon(file.name)}
              <span className="text-xs max-w-[100px] truncate">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-1 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}