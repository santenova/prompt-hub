import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Undo2, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

export default function VersionHistoryModal({ open, onOpenChange, prompt, onRevert }) {
  if (!prompt) return null;

  const versions = [
    {
      version: prompt.version || 1,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      subcategory: prompt.subcategory,
      tags: prompt.tags,
      saved_date: prompt.updated_date || new Date().toISOString(),
      change_notes: 'Current version'
    },
    ...(prompt.version_history || [])
  ].sort((a, b) => b.version - a.version);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Version History - {prompt.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {versions.map((version, idx) => (
              <Card key={idx} className={`border-2 ${idx === 0 ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200'}`}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={idx === 0 ? "default" : "secondary"} className={idx === 0 ? "bg-purple-600" : ""}>
                          Version {version.version}
                        </Badge>
                        {idx === 0 && <Badge className="bg-green-600">Current</Badge>}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(version.saved_date), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-lg text-gray-900">{version.title}</h3>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{version.category}</Badge>
                        {version.subcategory && (
                          <Badge variant="outline" className="text-xs">{version.subcategory}</Badge>
                        )}
                        {version.tags?.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    {idx !== 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRevert(version)}
                        className="flex-shrink-0"
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        Revert
                      </Button>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                      {version.content}
                    </p>
                  </div>

                  {version.change_notes && idx !== 0 && (
                    <p className="text-xs italic text-gray-600">
                      Note: {version.change_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}