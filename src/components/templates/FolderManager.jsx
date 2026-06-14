
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Folder, FolderPlus, Edit2, Trash2, MoreVertical } from "lucide-react";

export default function FolderManager({ 
  folders, 
  selectedFolder, 
  onSelectFolder,
  templates,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameFolderName, setRenameFolderName] = useState('');
  const [folderToEdit, setFolderToEdit] = useState(null);

  // Filter out empty folders and ensure we always have valid options
  const validFolders = React.useMemo(() => {
    const filtered = folders.filter(f => f && f.trim() !== '');
    // Always include Uncategorized if not already present
    const folderSet = new Set(filtered);
    if (!folderSet.has('Uncategorized')) {
      // Prepend 'Uncategorized' so it's always available, then it will be sorted alphabetically in the Select component.
      return ['Uncategorized', ...filtered];
    }
    return filtered;
  }, [folders]);

  const folderCounts = validFolders.reduce((acc, folder) => {
    const count = templates.filter(t => (t.folder || 'Uncategorized') === folder).length;
    acc[folder] = count;
    return acc;
  }, {});

  const totalCount = templates.length;

  const handleCreateFolder = () => {
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateDialog(false);
    }
  };

  const handleRenameFolder = () => {
    if (renameFolderName.trim() && !folders.includes(renameFolderName.trim()) && folderToEdit) {
      onRenameFolder(folderToEdit, renameFolderName.trim());
      setRenameFolderName('');
      setFolderToEdit(null);
      setShowRenameDialog(false);
    }
  };

  const handleDeleteFolder = () => {
    if (folderToEdit) {
      onDeleteFolder(folderToEdit);
      setFolderToEdit(null);
      setShowDeleteDialog(false);
      if (selectedFolder === folderToEdit) {
        onSelectFolder('All');
      }
    }
  };

  const openRenameDialog = (folder) => {
    setFolderToEdit(folder);
    setRenameFolderName(folder);
    setShowRenameDialog(true);
  };

  const openDeleteDialog = (folder) => {
    setFolderToEdit(folder);
    setShowDeleteDialog(true);
  };

  // Ensure selectedFolder is never empty or just whitespace, default to 'All'
  const safeSelectedFolder = selectedFolder && selectedFolder.trim() !== '' ? selectedFolder : 'All';

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Folder className="w-4 h-4 text-gray-500" />
          <span>Folder:</span>
        </div>
        
        <Select value={safeSelectedFolder} onValueChange={onSelectFolder}>
          <SelectTrigger className="w-[220px] bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="All">
              <div className="flex items-center justify-between w-full gap-2">
                <span>All Folders</span>
                <Badge variant="secondary" className="text-xs">
                  {totalCount}
                </Badge>
              </div>
            </SelectItem>
            {validFolders.sort().map((folder) => (
              <SelectItem key={folder} value={folder}>
                <div className="flex items-center justify-between w-full gap-2">
                  <span>{folder}</span>
                  <Badge variant="secondary" className="text-xs">
                    {folderCounts[folder] || 0}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
              <FolderPlus className="w-4 h-4 mr-2" />
              New Folder
            </DropdownMenuItem>
            {/* Disable rename/delete for 'All' and 'Uncategorized' */}
            {selectedFolder !== 'All' && selectedFolder !== 'Uncategorized' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openRenameDialog(selectedFolder)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename Folder
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openDeleteDialog(selectedFolder)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Folder
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder to organize your templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            {folders.includes(newFolderName.trim()) && (
              <p className="text-sm text-red-600">A folder with this name already exists</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setNewFolderName('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || folders.includes(newFolderName.trim())}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for "{folderToEdit}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="New folder name..."
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleRenameFolder()}
              autoFocus
            />
            {folders.includes(renameFolderName.trim()) && renameFolderName.trim() !== folderToEdit && (
              <p className="text-sm text-red-600">A folder with this name already exists</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRenameDialog(false);
              setRenameFolderName('');
              setFolderToEdit(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenameFolder}
              disabled={!renameFolderName.trim() || (folders.includes(renameFolderName.trim()) && renameFolderName.trim() !== folderToEdit)}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the folder "{folderToEdit}"?
              {folderCounts[folderToEdit] > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  This folder contains {folderCounts[folderToEdit]} template(s). 
                  They will be moved to "Uncategorized".
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setFolderToEdit(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
