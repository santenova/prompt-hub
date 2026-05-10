import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Clock, FileText } from "lucide-react";
import moment from 'moment';

export default function ContentVersionHistory({ open, onClose, item }) {
  const versions = item.version_history || [];
  const currentVersion = {
    version: item.version || 1,
    content: item.content || item.generated_content?.[0]?.content || '',
    created_date: item.last_edited_date || item.created_date,
    notes: item.version_notes || 'Current version'
  };

  const allVersions = [currentVersion, ...versions].sort((a, b) => b.version - a.version);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View all versions of this content
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 pr-4">
            {allVersions.map((version, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  idx === 0 
                    ? 'border-purple-300 bg-purple-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge className={idx === 0 ? 'bg-purple-600' : 'bg-gray-600'}>
                      Version {version.version}
                    </Badge>
                    {idx === 0 && (
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-3 h-3" />
                    {moment(version.created_date).format('MMM D, YYYY h:mm A')}
                  </div>
                </div>

                {version.notes && (
                  <p className="text-sm text-gray-700 mb-2 italic">
                    {version.notes}
                  </p>
                )}

                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {version.content?.split(/\s+/).length || 0} words
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-4">
                    {version.content}
                  </p>
                </div>
              </div>
            ))}

            {allVersions.length === 1 && (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No version history yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}