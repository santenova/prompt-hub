import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wrench, Plus, Edit2, Trash2, Star, Search, X, Copy } from 'lucide-react';
import { apiClient } from '@/apis/client';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToolManagement() {
  const [tools, setTools] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    parameters: [],
    prompt_template: '',
    tags: [],
    color: '#3B82F6'
  });

  const [newParam, setNewParam] = useState({
    name: '',
    type: 'text',
    required: false,
    description: ''
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.entities.CustomTool.list('-usage_count');
      setTools(data || []);
    } catch (error) {
      toast({
        title: 'Load Failed',
        description: 'Could not load custom tools',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParameter = () => {
    if (!newParam.name.trim()) {
      toast({
        title: 'Invalid Parameter',
        description: 'Parameter name is required',
        variant: 'destructive'
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      parameters: [...prev.parameters, { ...newParam }]
    }));
    setNewParam({ name: '', type: 'text', required: false, description: '' });
  };

  const handleRemoveParameter = (index) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (!formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.prompt_template.trim()) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (editingId) {
        await apiClient.entities.CustomTool.update(editingId, formData);
        toast({ title: 'Tool Updated', description: 'Custom tool has been updated' });
      } else {
        await apiClient.entities.CustomTool.create({
          ...formData,
          usage_count: 0,
          is_favorite: false
        });
        toast({ title: 'Tool Created', description: 'New custom tool has been added' });
      }
      setShowDialog(false);
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        category: 'other',
        parameters: [],
        prompt_template: '',
        tags: [],
        color: '#3B82F6'
      });
      loadTools();
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (tool) => {
    setFormData(tool);
    setEditingId(tool.id);
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) return;

    try {
      await apiClient.entities.CustomTool.delete(id);
      toast({ title: 'Tool Deleted', description: 'Custom tool has been removed' });
      loadTools();
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleToggleFavorite = async (tool) => {
    try {
      await apiClient.entities.CustomTool.update(tool.id, {
        is_favorite: !tool.is_favorite
      });
      loadTools();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleIncrementUsage = async (tool) => {
    try {
      await apiClient.entities.CustomTool.update(tool.id, {
        usage_count: (tool.usage_count || 0) + 1
      });
      loadTools();
    } catch (error) {
      console.error('Failed to update usage:', error);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || tool.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['text', 'analysis', 'generation', 'organization', 'integration', 'automation', 'other'];

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Tool Management</h3>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (filteredTools.length === 0) {
                toast({
                  title: 'No Tools',
                  description: 'No tools available to add to queue',
                  variant: 'destructive'
                });
                return;
              }
              
              // Dispatch event to add all filtered tools to queue
              window.dispatchEvent(new CustomEvent('addAllToolsToQueue', {
                detail: { tools: filteredTools }
              }));
              
              toast({
                title: 'Added to Queue',
                description: `${filteredTools.length} tool${filteredTools.length > 1 ? 's' : ''} added to queue`
              });
            }}
            className="h-8"
            disabled={filteredTools.length === 0}
          >
            <Package className="w-3 h-3 mr-1" />
            Queue All
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: '',
                description: '',
                category: 'other',
                parameters: [],
                prompt_template: '',
                tags: [],
                color: '#3B82F6'
              });
              setShowDialog(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 h-8"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Tool
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tools List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          <AnimatePresence>
            {filteredTools.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                {tools.length === 0 ? 'No tools yet. Create one to get started!' : 'No tools match your search'}
              </div>
            ) : (
              filteredTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: tool.color + '20', borderLeft: `3px solid ${tool.color}` }}
                      >
                        <Wrench className="w-4 h-4" style={{ color: tool.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm text-gray-900">{tool.name}</h4>
                            <p className="text-xs text-gray-600 mt-1">{tool.description}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleToggleFavorite(tool)}
                              title="Toggle favorite"
                            >
                              <Star
                                className="w-3 h-3"
                                fill={tool.is_favorite ? 'currentColor' : 'none'}
                                color={tool.is_favorite ? '#fbbf24' : '#d1d5db'}
                              />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleEdit(tool)}
                              title="Edit tool"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(tool.id)}
                              title="Delete tool"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Category and Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className="text-xs h-5">
                            {tool.category}
                          </Badge>
                          {tool.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs h-5">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Parameters */}
                        {tool.parameters?.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">{tool.parameters.length} parameter{tool.parameters.length > 1 ? 's' : ''}</span>
                          </div>
                        )}

                        {/* Usage Badge */}
                        {tool.usage_count > 0 && (
                          <Badge variant="secondary" className="text-xs h-5 mt-2">
                            Used {tool.usage_count}x
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Tool' : 'Create New Tool'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update your custom tool configuration' : 'Define a new custom AI tool'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4 space-y-4">
            {/* Basic Info */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium">Tool Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Email Generator, Code Reviewer"
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this tool do?"
                  className="h-16 text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Color</Label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="h-8 w-12 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* AI Prompt Template */}
              <div>
                <Label className="text-xs font-medium">AI Prompt Template</Label>
                <Textarea
                  value={formData.prompt_template}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt_template: e.target.value }))}
                  placeholder="Enter the prompt template. Use {parameter_name} for placeholders."
                  className="h-20 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            {/* Parameters */}
            <div className="space-y-2 border-t pt-3">
              <h4 className="font-medium text-xs">Parameters</h4>
              <div className="space-y-2">
                {formData.parameters.map((param, idx) => (
                  <div key={idx} className="p-2 bg-gray-50 rounded border flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-xs text-gray-900">{param.name}</p>
                      <p className="text-xs text-gray-600">{param.type}{param.required ? ' • Required' : ''}</p>
                      {param.description && (
                        <p className="text-xs text-gray-500">{param.description}</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-600 hover:bg-red-50 flex-shrink-0"
                      onClick={() => handleRemoveParameter(idx)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Parameter */}
              <div className="space-y-2 p-2 bg-purple-50 rounded border">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="e.g., description, content, title"
                    value={newParam.name}
                    onChange={(e) => setNewParam(prev => ({ ...prev, name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                    className="h-7 text-xs"
                  />
                  <Select value={newParam.type} onValueChange={(value) => setNewParam(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="What this parameter does (optional)"
                  value={newParam.description}
                  onChange={(e) => setNewParam(prev => ({ ...prev, description: e.target.value }))}
                  className="h-7 text-xs"
                />
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 text-xs cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={newParam.required}
                      onChange={(e) => setNewParam(prev => ({ ...prev, required: e.target.checked }))}
                      className="w-3 h-3 rounded"
                    />
                    <span>Required</span>
                  </label>
                  <Button
                    size="sm"
                    onClick={handleAddParameter}
                    className="h-7 text-xs bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs font-medium">Tags</Label>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge key={tag} className="text-xs h-6 pl-2 pr-1 gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="h-7 text-xs flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="h-7 text-xs"
                  variant="outline"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-2 border-t pt-3 mt-3">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="h-8 text-xs">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 h-8 text-xs">
              {editingId ? 'Update' : 'Create'} Tool
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
