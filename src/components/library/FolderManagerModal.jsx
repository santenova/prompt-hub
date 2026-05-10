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
import { Folder, Plus, Trash2, Edit2 } from "lucide-react";

export default function FolderManagerModal({ open, onClose, folders, contentItems, onUpdate }) {
  const [newFolder, setNewFolder] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [editedName, setEditedName] = useState('');

  const getFolderCount = (folder) => {
    return contentItems.filter(item => (item.folder || 'Uncategorized') === folder).length;
  };

  const handleAddFolder = () => {
    if (newFolder.trim() && !folders.includes(newFolder.trim())) {
      setNewFolder('');
    }
  };

  const handleRenameFolder = (oldName) => {
    if (editedName.trim() && editedName !== oldName) {
      const itemsInFolder = contentItems.filter(item => item.folder === oldName);
      itemsInFolder.forEach(item => {
        onUpdate(item.id, editedName.trim());
      });
      setEditingFolder(null);
      setEditedName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-purple-600" />
            Manage Folders
          </DialogTitle>
          <DialogDescription>
            Organize your content into folders for better management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Folder */}
          <div className="flex gap-2">
            <Input
              placeholder="New folder name..."
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
            />
            <Button onClick={handleAddFolder}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Folder List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {folders.map(folder => (
              <div
                key={folder}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:border-purple-300 transition-colors"
              >
                {editingFolder === folder ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder)}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => handleRenameFolder(folder)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingFolder(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{folder}</span>
                      <Badge variant="secondary">{getFolderCount(folder)} items</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingFolder(folder);
                          setEditedName(folder);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}