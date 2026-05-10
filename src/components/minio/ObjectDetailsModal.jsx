import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Image, 
  File, 
  Download, 
  Calendar, 
  Database,
  Copy
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function ObjectDetailsModal({ object, bucket, open, onOpenChange, onDownload }) {
  const { toast } = useToast();

  if (!object) return null;

  const getFileIcon = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image className="w-6 h-6 text-blue-600" />;
    } else if (['txt', 'md', 'json', 'csv'].includes(ext)) {
      return <FileText className="w-6 h-6 text-green-600" />;
    }
    return <File className="w-6 h-6 text-gray-600" />;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Object name copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(object.name)}
            Object Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium">Name</label>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-sm font-mono break-all">{object.name}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(object.name)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Size</label>
                <div className="flex items-center gap-2 mt-1">
                  <Database className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">{formatBytes(object.size)}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 font-medium">Last Modified</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm">{new Date(object.lastModified).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium">Bucket</label>
              <div className="mt-1">
                <Badge variant="outline" className="font-mono">{bucket}</Badge>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium">Full Path</label>
              <p className="text-xs font-mono text-gray-600 mt-1 break-all">
                {bucket}/{object.name}
              </p>
            </div>
          </div>

          <Button
            onClick={() => onDownload(object)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}