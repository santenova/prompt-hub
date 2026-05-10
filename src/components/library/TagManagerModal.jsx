import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tag, Plus, X } from "lucide-react";

export default function TagManagerModal({ open, onClose, tags, contentItems, onUpdate }) {
  const [newTag, setNewTag] = useState('');

  const getTagCount = (tag) => {
    return contentItems.filter(item => item.tags?.includes(tag)).length;
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    if (confirm(`Remove tag "${tagToRemove}" from all content?`)) {
      const itemsWithTag = contentItems.filter(item => item.tags?.includes(tagToRemove));
      itemsWithTag.forEach(item => {
        const updatedTags = item.tags.filter(t => t !== tagToRemove);
        onUpdate(item.id, updatedTags);
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-600" />
            Manage Tags
          </DialogTitle>
          <DialogDescription>
            View and manage all tags used in your content library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Tag */}
          <div className="flex gap-2">
            <Input
              placeholder="New tag name..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button onClick={handleAddTag}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Tag Cloud */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">All Tags ({tags.length})</p>
            <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
              {tags.map(tag => (
                <div
                  key={tag}
                  className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-purple-200 hover:border-purple-400 transition-colors"
                >
                  <Tag className="w-3 h-3 text-purple-600" />
                  <span className="text-sm font-medium">{tag}</span>
                  <Badge variant="secondary" className="text-xs">
                    {getTagCount(tag)}
                  </Badge>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-red-100 rounded-full p-1 transition-colors"
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-gray-500 w-full text-center py-4">
                  No tags yet. Add your first tag above!
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}