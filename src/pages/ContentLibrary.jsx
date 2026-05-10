import React, { useState, useEffect } from 'react';
import { apiClient } from '@/apis/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { handleRateLimitError } from '../components/utils/rateLimitHandler';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Folder, FolderOpen, Search, Filter, Star, Tag, Clock, 
  FileText, Sparkles, Copy, Download, Trash2, Edit, Archive,
  Plus, ChevronRight, MoreVertical, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import ContentItemCard from "../components/library/ContentItemCard";
import FolderManagerModal from "../components/library/FolderManagerModal";
import TagManagerModal from "../components/library/TagManagerModal";
import ContentVersionHistory from "../components/library/ContentVersionHistory";
import ContentSearchFilters from "../components/library/ContentSearchFilters";

export default function ContentLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTool, setSelectedTool] = useState('all');
  const [sortBy, setSortBy] = useState('created_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Auth error:', error);
      }
    };
    fetchUser();
  }, []);

  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ['contentLibrary', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        return await apiClient.entities.ContentHistory.filter(
          { created_by: currentUser.email },
          '-created_date',
          1000
        );
      } catch (error) {
        handleRateLimitError(error);
        return [];
      }
    },
    enabled: !!currentUser,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.message?.includes('Rate limit')) return failureCount < 3;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.ContentHistory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contentLibrary']);
      toast({ title: "Content updated successfully" });
    },
    onError: (error) => {
      handleRateLimitError(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.ContentHistory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contentLibrary']);
      toast({ title: "Content deleted successfully" });
    },
    onError: (error) => {
      handleRateLimitError(error);
    },
  });

  // Extract unique folders and tags
  const allFolders = [...new Set(contentItems.map(item => item.folder || 'Uncategorized'))];
  const allTags = [...new Set(contentItems.flatMap(item => item.tags || []))];

  // Filter content
  const filteredContent = contentItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFolder = selectedFolder === 'all' || 
      (item.folder || 'Uncategorized') === selectedFolder;
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => item.tags?.includes(tag));
    
    const matchesStatus = selectedStatus === 'all' || 
      (item.status || 'draft') === selectedStatus;
    
    const matchesTool = selectedTool === 'all' || 
      item.tool_type === selectedTool;

    return matchesSearch && matchesFolder && matchesTags && matchesStatus && matchesTool;
  });

  // Sort content
  const sortedContent = [...filteredContent].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'created_date' || sortBy === 'last_edited_date') {
      aVal = new Date(aVal || a.created_date);
      bVal = new Date(bVal || b.created_date);
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Stats
  const stats = {
    total: contentItems.length,
    favorites: contentItems.filter(i => i.is_favorite).length,
    drafts: contentItems.filter(i => (i.status || 'draft') === 'draft').length,
    completed: contentItems.filter(i => i.status === 'completed').length
  };

  const handleMove = (itemId, newFolder) => {
    updateMutation.mutate({ id: itemId, data: { folder: newFolder } });
  };

  const handleTag = (itemId, newTags) => {
    updateMutation.mutate({ id: itemId, data: { tags: newTags } });
  };

  const handleStatusChange = (itemId, newStatus) => {
    updateMutation.mutate({ 
      id: itemId, 
      data: { 
        status: newStatus,
        last_edited_date: new Date().toISOString()
      } 
    });
  };

  const handleFavorite = (itemId, isFavorite) => {
    updateMutation.mutate({ id: itemId, data: { is_favorite: isFavorite } });
  };

  const handleDelete = (itemId) => {
    if (confirm('Are you sure you want to delete this content?')) {
      deleteMutation.mutate(itemId);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const downloadContent = (content, title, item) => {
    // For AI image generator, download image metadata with URL
    if (item?.tool_type === 'ai_image_generator' && item?.image_url) {
      const imageData = {
        title: title,
        image_url: item.image_url,
        image_prompt: item.image_prompt || '',
        image_style: item.image_style || '',
        created_date: item.created_date,
        metadata: item.image_metadata || {}
      };
      const file = new Blob([JSON.stringify(imageData, null, 2)], { type: 'application/json' });
      const element = document.createElement('a');
      element.href = URL.createObjectURL(file);
      element.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
    } else {
      // Regular text content download
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-purple-600" />
            Content Library
          </h1>
          <p className="text-gray-600 mt-1">Organize and manage all your generated content</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTagModal(true)}
          >
            <Tag className="w-4 h-4 mr-2" />
            Manage Tags
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFolderModal(true)}
          >
            <Folder className="w-4 h-4 mr-2" />
            Manage Folders
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Favorites</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.favorites}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-blue-600">{stats.drafts}</p>
              </div>
              <Edit className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <Sparkles className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <ContentSearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFolder={selectedFolder}
        onFolderChange={setSelectedFolder}
        allFolders={allFolders}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        allTags={allTags}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Content Grid/List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-gray-200"></CardHeader>
                <CardContent className="h-40 bg-gray-100"></CardContent>
              </Card>
            ))}
          </div>
        ) : sortedContent.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No content found</h3>
              <p className="text-gray-500 text-center mb-4">
                {searchQuery || selectedTags.length > 0 
                  ? 'Try adjusting your filters'
                  : 'Start generating content to build your library'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedContent.map((item, index) => (
              <ContentItemCard
                key={item.id}
                item={item}
                autoRotate={index < 3}
                onFavorite={(isFavorite) => handleFavorite(item.id, isFavorite)}
                onStatusChange={(status) => handleStatusChange(item.id, status)}
                onMove={(folder) => handleMove(item.id, folder)}
                onTag={(tags) => handleTag(item.id, tags)}
                onDelete={() => handleDelete(item.id)}
                onCopy={copyToClipboard}
                onDownload={(content, title) => downloadContent(content, title, item)}
                onShowHistory={() => {
                  setSelectedItem(item);
                  setShowVersionHistory(true);
                }}
                allFolders={allFolders}
                allTags={allTags}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <FolderManagerModal
        open={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        folders={allFolders}
        contentItems={contentItems}
        onUpdate={(itemId, folder) => handleMove(itemId, folder)}
      />

      <TagManagerModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        tags={allTags}
        contentItems={contentItems}
        onUpdate={(itemId, tags) => handleTag(itemId, tags)}
      />

      {selectedItem && (
        <ContentVersionHistory
          open={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
        />
      )}
    </div>
  );
}
