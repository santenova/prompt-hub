import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit3, Save, X, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/apis/client';

export default function PlaceholderEditor({ template, onUpdate }) {
  const { toast } = useToast();
  const [placeholders, setPlaceholders] = useState(template?.placeholders || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleAddPlaceholder = () => {
    const newPlaceholder = {
      key: `placeholder_${Date.now()}`,
      label: 'New Placeholder',
      description: '',
      type: 'text',
      required: false,
      default: ''
    };
    setPlaceholders([...placeholders, newPlaceholder]);
    setEditingIndex(placeholders.length);
    setEditForm(newPlaceholder);
  };

  const handleEditPlaceholder = (index) => {
    setEditingIndex(index);
    setEditForm({ ...placeholders[index] });
  };

  const handleSaveEdit = () => {
    const updated = [...placeholders];
    updated[editingIndex] = editForm;
    setPlaceholders(updated);
    setEditingIndex(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    if (!placeholders[editingIndex]?.label || placeholders[editingIndex].label === 'New Placeholder') {
      // Remove if it was a new placeholder that wasn't saved
      const updated = placeholders.filter((_, idx) => idx !== editingIndex);
      setPlaceholders(updated);
    }
    setEditingIndex(null);
    setEditForm({});
  };

  const handleDeletePlaceholder = (index) => {
    if (confirm('Delete this placeholder?')) {
      const updated = placeholders.filter((_, idx) => idx !== index);
      setPlaceholders(updated);
    }
  };

  const handleSaveToTemplate = async () => {
    setIsSaving(true);
    try {
      await apiClient.entities.Template.update(template.id, {
        placeholders: placeholders
      });
      
      if (onUpdate) {
        onUpdate({ ...template, placeholders });
      }

      toast({
        title: "Placeholders Updated",
        description: "Template placeholders have been saved"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-600" />
            Template Placeholders
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddPlaceholder}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Placeholder
            </Button>
            {placeholders.length > 0 && (
              <Button
                size="sm"
                onClick={handleSaveToTemplate}
                disabled={isSaving || editingIndex !== null}
                className="bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {placeholders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Edit3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No placeholders yet</p>
            <p className="text-xs mt-1">Add placeholders to make this template dynamic</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {placeholders.map((placeholder, index) => (
                <motion.div
                  key={placeholder.key}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`p-4 rounded-lg border-2 ${
                    editingIndex === index 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } transition-colors`}
                >
                  {editingIndex === index ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Placeholder Key*</Label>
                          <Input
                            value={editForm.key || ''}
                            onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                            placeholder="e.g., product_name"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Label*</Label>
                          <Input
                            value={editForm.label || ''}
                            onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                            placeholder="e.g., Product Name"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Help text for this placeholder"
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={editForm.type || 'text'}
                            onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="url">URL</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Default Value</Label>
                          <Input
                            value={editForm.default || ''}
                            onChange={(e) => setEditForm({ ...editForm, default: e.target.value })}
                            placeholder="Optional"
                            className="text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Required?</Label>
                          <div className="flex items-center justify-center h-9 bg-gray-50 rounded-md">
                            <Switch
                              checked={editForm.required || false}
                              onCheckedChange={(checked) => setEditForm({ ...editForm, required: checked })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{placeholder.label}</span>
                            {placeholder.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{placeholder.type}</Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            Key: <code className="bg-gray-100 px-1 rounded">{placeholder.key}</code>
                          </p>
                          {placeholder.description && (
                            <p className="text-xs text-gray-500 italic">{placeholder.description}</p>
                          )}
                          {placeholder.default && (
                            <p className="text-xs text-gray-500 mt-1">
                              Default: "{placeholder.default}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditPlaceholder(index)}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePlaceholder(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
