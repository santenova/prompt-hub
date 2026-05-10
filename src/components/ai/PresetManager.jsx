import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Star, Trash2, Download, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

export default function PresetManager({ 
  currentSettings, 
  onLoadPreset 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadPopover, setShowLoadPopover] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const { data: presets = [] } = useQuery({
    queryKey: ['generationPresets'],
    queryFn: () => apiClient.entities.GenerationPreset.list('-created_date'),
    initialData: []
  });

  const savePresetMutation = useMutation({
    mutationFn: async (data) => {
      // Check if preset with same name exists
      const existingPreset = presets.find(p => p.name === data.name);
      
      if (existingPreset) {
        // Update existing preset
        return apiClient.entities.GenerationPreset.update(existingPreset.id, data);
      } else {
        // Create new preset
        return apiClient.entities.GenerationPreset.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generationPresets'] });
      setShowSaveDialog(false);
      setPresetName('');
      setPresetDescription('');
      toast({
        title: "Preset Saved",
        description: "Your generation settings have been saved"
      });
    }
  });

  const deletePresetMutation = useMutation({
    mutationFn: (id) => apiClient.entities.GenerationPreset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generationPresets'] });
      toast({
        title: "Preset Deleted",
        description: "Preset has been removed"
      });
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => 
      apiClient.entities.GenerationPreset.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generationPresets'] });
    }
  });

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this preset",
        variant: "destructive"
      });
      return;
    }

    savePresetMutation.mutate({
      name: presetName,
      description: presetDescription,
      ...currentSettings
    });
  };

  const handleLoadPreset = (preset) => {
    onLoadPreset(preset);
    setShowLoadPopover(false);
    
    // Update use count and last used
    apiClient.entities.GenerationPreset.update(preset.id, {
      use_count: (preset.use_count || 0) + 1,
      last_used: new Date().toISOString()
    });

    toast({
      title: "Preset Loaded",
      description: `"${preset.name}" settings applied`
    });
  };

  return (
    <div className="flex gap-2">
      {/* Save Preset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSaveDialog(true)}
        className="gap-2"
      >
        <Save className="w-4 h-4" />
        Save Preset
      </Button>

      {/* Load Preset Popover */}
      <Popover open={showLoadPopover} onOpenChange={setShowLoadPopover}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Load Preset
            {presets.length > 0 && (
              <Badge className="ml-1">{presets.length}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="end">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm mb-2">Your Presets</h3>
            {presets.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No presets saved yet
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {presets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-gray-50 rounded-lg border hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">{preset.name}</h4>
                          {preset.is_favorite && (
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        {preset.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {preset.description}
                          </p>
                        )}
                        <div className="flex gap-2 flex-wrap text-xs text-gray-500">
                          {preset.use_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Used {preset.use_count}x
                            </span>
                          )}
                          {preset.variation_count && (
                            <Badge variant="outline" className="text-xs">
                              {preset.variation_count} vars
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleFavoriteMutation.mutate({ 
                            id: preset.id, 
                            isFavorite: preset.is_favorite 
                          })}
                        >
                          <Star className={`w-3 h-3 ${preset.is_favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Delete preset "${preset.name}"?`)) {
                              deletePresetMutation.mutate(preset.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      Load This Preset
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-purple-600" />
              Save Generation Preset
            </DialogTitle>
            <DialogDescription>
              Save your current settings (project, persona, templates, style, variation count) as a preset for quick access later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name*</Label>
              <Input
                id="preset-name"
                placeholder="e.g., Marketing Campaign Setup"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (Optional)</Label>
              <Textarea
                id="preset-description"
                placeholder="What is this preset for?"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Preview current settings */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
              <p className="font-semibold text-gray-900">Current Settings:</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>• Project: {currentSettings.selectedProject?.name || 'None'}</div>
                <div>• Persona: {currentSettings.selectedPersona?.name || 'None'}</div>
                <div>• Templates: {currentSettings.selectedTemplates?.length || 0}</div>
                <div>• Style: {currentSettings.contentStyle || 'None'}</div>
                <div>• Variations: {currentSettings.variationCount || 10}</div>
                <div>• Scoring: {currentSettings.enableScoring ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePreset}
              disabled={savePresetMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {savePresetMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
