import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Folder, FolderOpen, Plus, X, Edit2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

export default function FolderManagement({ 
  folders, 
  onFoldersChange, 
  selectedFolder, 
  onFolderSelect,
  sessionCounts = {} 
}) {
  const [editingFolder, setEditingFolder] = useState(null);
  const [editName, setEditName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const { toast } = useToast();

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    
    if (folders.includes(newFolderName.trim())) {
      toast({
        title: "Folder Exists",
        description: "A folder with this name already exists",
        variant: "destructive"
      });
      return;
    }

    const updated = [...folders, newFolderName.trim()];
    onFoldersChange(updated);
    setNewFolderName('');
    
    toast({
      title: "Folder Created",
      description: newFolderName.trim()
    });
  };

  const renameFolder = (oldName) => {
    if (!editName.trim() || editName === oldName) {
      setEditingFolder(null);
      return;
    }

    if (folders.includes(editName.trim())) {
      toast({
        title: "Name Taken",
        description: "A folder with this name already exists",
        variant: "destructive"
      });
      return;
    }

    const updated = folders.map(f => f === oldName ? editName.trim() : f);
    onFoldersChange(updated);
    setEditingFolder(null);
    setEditName('');
    
    toast({
      title: "Folder Renamed",
      description: `${oldName} → ${editName.trim()}`
    });
  };

  const deleteFolder = (folderName) => {
    if (folderName === 'Uncategorized') {
      toast({
        title: "Cannot Delete",
        description: "Uncategorized folder cannot be deleted",
        variant: "destructive"
      });
      return;
    }

    const count = sessionCounts[folderName] || 0;
    if (count > 0) {
      toast({
        title: "Folder Not Empty",
        description: `Move ${count} session(s) first`,
        variant: "destructive"
      });
      return;
    }

    const updated = folders.filter(f => f !== folderName);
    onFoldersChange(updated);
    
    if (selectedFolder === folderName) {
      onFolderSelect('all');
    }
    
    toast({
      title: "Folder Deleted",
      description: folderName
    });
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-blue-600" />
          Folder Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add New Folder */}
        <div className="flex gap-2">
          <Input
            placeholder="New folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFolder()}
            className="h-9"
          />
          <Button 
            onClick={addFolder} 
            disabled={!newFolderName.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Folder List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {folders.map((folder) => {
              const count = sessionCounts[folder] || 0;
              const isEditing = editingFolder === folder;
              const isSelected = selectedFolder === folder;

              return (
                <motion.div
                  key={folder}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-blue-100 border-blue-400' 
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameFolder(folder);
                          if (e.key === 'Escape') setEditingFolder(null);
                        }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => renameFolder(folder)}
                          className="h-6 w-6"
                        >
                          <Check className="w-3 h-3 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingFolder(null)}
                          className="h-6 w-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onFolderSelect(folder)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <Folder className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {folder}
                        </span>
                        {count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {count}
                          </Badge>
                        )}
                      </button>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingFolder(folder);
                            setEditName(folder);
                          }}
                          className="h-6 w-6"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        {folder !== 'Uncategorized' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFolder(folder)}
                            className="h-6 w-6 text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}