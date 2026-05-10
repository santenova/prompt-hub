import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  FileText,
  Layers
} from "lucide-react";

export default function FolderTreeView({ 
  folders, 
  templates, 
  selectedFolder, 
  onSelectFolder,
  className = ""
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['All']));

  // Calculate folder counts
  const folderCounts = folders.reduce((acc, folder) => {
    const count = templates.filter(t => (t.folder || 'Uncategorized') === folder).length;
    acc[folder] = count;
    return acc;
  }, {});

  const totalCount = templates.length;

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folder)) {
        newSet.delete(folder);
      } else {
        newSet.add(folder);
      }
      return newSet;
    });
  };

  const handleSelectFolder = (folder) => {
    onSelectFolder(folder);
    if (!expandedFolders.has(folder)) {
      toggleFolder(folder);
    }
  };

  const FolderItem = ({ folder, count, isSelected, level = 0 }) => {
    const isExpanded = expandedFolders.has(folder);
    const templatesInFolder = templates.filter(t => (t.folder || 'Uncategorized') === folder);

    return (
      <div className="w-full">
        <div
          onClick={() => handleSelectFolder(folder)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
            ${isSelected 
              ? 'bg-gradient-to-r from-purple-100 to-indigo-100 border-l-4 border-purple-600 font-medium' 
              : 'hover:bg-gray-50 border-l-4 border-transparent'
            }
          `}
          style={{ paddingLeft: `${(level * 16) + 12}px` }}
        >
          {count > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder);
              }}
              className="hover:bg-gray-200 rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
          {count === 0 && <div className="w-5" />}
          
          {isExpanded && count > 0 ? (
            <FolderOpen className="w-4 h-4 text-purple-600" />
          ) : (
            <Folder className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-gray-500'}`} />
          )}
          
          <span className={`flex-1 text-sm ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>
            {folder}
          </span>
          
          <Badge 
            variant={isSelected ? "default" : "secondary"} 
            className={`text-xs ${isSelected ? 'bg-purple-600' : ''}`}
          >
            {count}
          </Badge>
        </div>

        {/* Show templates in folder when expanded */}
        <AnimatePresence>
          {isExpanded && count > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {templatesInFolder.slice(0, 5).map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded cursor-pointer"
                  style={{ paddingLeft: `${(level + 1) * 16 + 28}px` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Could emit event to scroll to template or highlight it
                  }}
                >
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{template.title}</span>
                </div>
              ))}
              {templatesInFolder.length > 5 && (
                <div
                  className="px-3 py-1 text-xs text-gray-500 italic"
                  style={{ paddingLeft: `${(level + 1) * 16 + 28}px` }}
                >
                  +{templatesInFolder.length - 5} more...
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600" />
          Folder Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* All Folders */}
        <FolderItem
          folder="All"
          count={totalCount}
          isSelected={selectedFolder === 'All'}
        />

        {/* Individual Folders */}
        {folders.sort((a, b) => {
          // Sort Uncategorized last
          if (a === 'Uncategorized') return 1;
          if (b === 'Uncategorized') return -1;
          return a.localeCompare(b);
        }).map((folder) => (
          <FolderItem
            key={folder}
            folder={folder}
            count={folderCounts[folder] || 0}
            isSelected={selectedFolder === folder}
          />
        ))}

        {folders.length === 1 && folders[0] === 'Uncategorized' && (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No folders created yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Create folders to organize your templates
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}