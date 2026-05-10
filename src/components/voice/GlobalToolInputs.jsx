import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  X, 
  Save, 
  Trash2, 
  Star,
  FolderOpen,
  Target,
  Palette,
  TrendingUp,
  Users,
  Sparkles,
  Layers
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/apis/client";

const PLATFORMS = [
  'Instagram', 'TikTok', 'LinkedIn', 'Twitter/X', 'Facebook', 
  'YouTube', 'Pinterest', 'Snapchat', 'Blog', 'Website', 'Email'
];

const TONES = [
  'Professional', 'Casual', 'Friendly', 'Enthusiastic', 'Formal',
  'Conversational', 'Authoritative', 'Empathetic', 'Humorous', 'Inspirational'
];

const STYLES = [
  'Storytelling', 'Educational', 'Persuasive', 'Informative', 
  'Entertaining', 'Emotional', 'Direct', 'Creative', 'Technical', 'Minimalist'
];

const GOALS = [
  'Engagement', 'Conversion', 'Education', 'Brand Awareness', 
  'Lead Generation', 'Traffic', 'Community Building', 'Sales', 'Retention'
];

export default function GlobalToolInputs({ onInputsChange, sessionId }) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      return localStorage.getItem('voice_global_inputs_expanded') === 'true';
    } catch { return false; }
  });

  const [inputs, setInputs] = useState(() => {
    try {
      const saved = localStorage.getItem(`voice_global_tool_inputs_${sessionId || 'default'}`);
      return saved ? JSON.parse(saved) : {
        platforms: [],
        tone: 'Professional',
        style: 'Informative',
        topic: '',
        targetAudience: '',
        primaryGoal: 'Engagement',
        keywords: '',
        excludeWords: '',
        additionalContext: '',
        maxConcurrentProcess: 1
      };
    } catch {
      return {
        platforms: [],
        tone: 'Professional',
        style: 'Informative',
        topic: '',
        targetAudience: '',
        primaryGoal: 'Engagement',
        keywords: '',
        excludeWords: '',
        additionalContext: '',
        maxConcurrentProcess: 1
      };
    }
  });

  const [savedPresets, setSavedPresets] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [recentPresets, setRecentPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('voice_recent_presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    setIsExpanded(false);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem('voice_global_inputs_expanded', isExpanded);
  }, [isExpanded]);

  useEffect(() => {
    const key = `voice_global_tool_inputs_${sessionId || 'default'}`;
    localStorage.setItem(key, JSON.stringify(inputs));
    
    if (onInputsChange) {
      onInputsChange(inputs);
    }
  }, [inputs, sessionId, onInputsChange]);

  const loadPresets = async () => {
    try {
      const presets = await apiClient.entities.PlaceholderPreset.filter(
        { preset_type: 'global_tool_inputs' },
        '-last_used',
        20
      );
      setSavedPresets(presets);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const savePreset = async () => {
    if (!presetName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this preset",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiClient.entities.PlaceholderPreset.create({
        preset_name: presetName,
        preset_type: 'global_tool_inputs',
        description: `Global inputs: ${inputs.platforms.join(', ')} | ${inputs.topic || 'No topic'}`,
        placeholder_values: inputs,
        last_used: new Date().toISOString()
      });

      toast({
        title: "Preset Saved",
        description: `"${presetName}" saved successfully`
      });

      setShowSaveDialog(false);
      setPresetName('');
      loadPresets();
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadPreset = async (preset) => {
    setInputs(preset.placeholder_values);
    
    // Update recent presets in localStorage
    const updatedRecent = [
      preset.id,
      ...recentPresets.filter(id => id !== preset.id)
    ].slice(0, 5);
    setRecentPresets(updatedRecent);
    localStorage.setItem('voice_recent_presets', JSON.stringify(updatedRecent));
    
    try {
      await apiClient.entities.PlaceholderPreset.update(preset.id, {
        last_used: new Date().toISOString(),
        use_count: (preset.use_count || 0) + 1
      });
      loadPresets();
    } catch (error) {
      console.error('Failed to update preset:', error);
    }

    toast({
      title: "Preset Loaded",
      description: `"${preset.preset_name}" applied`
    });
  };

  const deletePreset = async (preset) => {
    try {
      await apiClient.entities.PlaceholderPreset.delete(preset.id);
      loadPresets();
      toast({
        title: "Preset Deleted",
        description: `"${preset.preset_name}" removed`
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const togglePlatform = (platform) => {
    setInputs(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const clearAllInputs = () => {
    setInputs({
      platforms: [],
      tone: 'Professional',
      style: 'Informative',
      topic: '',
      targetAudience: '',
      primaryGoal: 'Engagement',
      keywords: '',
      excludeWords: '',
      additionalContext: '',
      maxConcurrentProcess: 1
    });
    toast({
      title: "Inputs Cleared",
      description: "All global inputs have been reset"
    });
  };

  return (
    <Card className="border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 transition-all">
      <CardHeader 
        className="pb-3 cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" />
            <CardTitle className="text-sm">Global Tool Inputs</CardTitle>
            {(inputs.platforms.length > 0 || inputs.topic.trim()) && (
              <Badge className="bg-indigo-600 text-xs">
                {inputs.platforms.length + (inputs.topic ? 1 : 0)} set
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <X className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {/* Recent Presets */}
              {recentPresets.length > 0 && savedPresets.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-600" />
                      Recently Used
                    </Label>
                  </div>
                  <div className="space-y-1">
                    {recentPresets
                      .map(id => savedPresets.find(p => p.id === id))
                      .filter(Boolean)
                      .map((preset) => (
                        <div
                          key={preset.id}
                          className="flex items-center justify-between p-2 rounded border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer"
                          onClick={() => loadPreset(preset)}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{preset.preset_name}</p>
                            <p className="text-xs text-gray-500">Used {preset.use_count || 0} times</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePreset(preset);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Saved Presets */}
              {savedPresets.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <FolderOpen className="w-3 h-3 text-blue-600" />
                      All Presets
                    </Label>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {savedPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-2 rounded border bg-white hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => loadPreset(preset)}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{preset.preset_name}</p>
                          <p className="text-xs text-gray-500">Used {preset.use_count || 0} times</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(preset);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Target className="w-3 h-3 text-indigo-600" />
                  Platforms
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((platform) => (
                    <Badge
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`cursor-pointer transition-all ${
                        inputs.platforms.includes(platform)
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {platform}
                      {inputs.platforms.includes(platform) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  Topic
                </Label>
                <Input
                  placeholder="e.g., AI in Marketing, Product Launch..."
                  value={inputs.topic}
                  onChange={(e) => setInputs(prev => ({ ...prev, topic: e.target.value }))}
                  className="bg-white"
                />
              </div>

              {/* Tone & Style */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Palette className="w-3 h-3 text-pink-600" />
                    Tone
                  </Label>
                  <Select value={inputs.tone} onValueChange={(value) => setInputs(prev => ({ ...prev, tone: value }))}>
                    <SelectTrigger className="bg-white h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((tone) => (
                        <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Palette className="w-3 h-3 text-purple-600" />
                    Style
                  </Label>
                  <Select value={inputs.style} onValueChange={(value) => setInputs(prev => ({ ...prev, style: value }))}>
                    <SelectTrigger className="bg-white h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((style) => (
                        <SelectItem key={style} value={style}>{style}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Audience & Primary Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3 text-blue-600" />
                    Target Audience
                  </Label>
                  <Input
                    placeholder="e.g., Marketers, Students..."
                    value={inputs.targetAudience}
                    onChange={(e) => setInputs(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="bg-white h-9 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    Primary Goal
                  </Label>
                  <Select value={inputs.primaryGoal} onValueChange={(value) => setInputs(prev => ({ ...prev, primaryGoal: value }))}>
                    <SelectTrigger className="bg-white h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOALS.map((goal) => (
                        <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Keywords & Exclude */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Keywords (comma-separated)</Label>
                  <Input
                    placeholder="AI, automation, productivity"
                    value={inputs.keywords}
                    onChange={(e) => setInputs(prev => ({ ...prev, keywords: e.target.value }))}
                    className="bg-white h-9 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Exclude Words</Label>
                  <Input
                    placeholder="jargon, technical"
                    value={inputs.excludeWords}
                    onChange={(e) => setInputs(prev => ({ ...prev, excludeWords: e.target.value }))}
                    className="bg-white h-9 text-xs"
                  />
                </div>
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Additional Context (Optional)</Label>
                <Textarea
                  placeholder="Any specific requirements, examples, or context..."
                  value={inputs.additionalContext}
                  onChange={(e) => setInputs(prev => ({ ...prev, additionalContext: e.target.value }))}
                  className="bg-white resize-none text-xs"
                  rows={3}
                />
              </div>

              {/* Max Concurrent Process */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Layers className="w-3 h-3 text-orange-600" />
                  Max Concurrent Process: {inputs.maxConcurrentProcess || 1}
                </Label>
                <Slider
                  value={[inputs.maxConcurrentProcess || 1]}
                  onValueChange={(value) => setInputs(prev => ({ ...prev, maxConcurrentProcess: value[0] }))}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Keep this at 1 if you run a CPU</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                  className="flex-1"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save Preset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllInputs}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              </div>

              {/* Save Dialog */}
              {showSaveDialog && (
                <div className="p-3 bg-white rounded-lg border-2 border-blue-200 space-y-2">
                  <Label className="text-xs font-semibold">Preset Name</Label>
                  <Input
                    placeholder="e.g., 'Q1 Social Campaign'"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                    className="h-9 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button onClick={savePreset} className="flex-1 bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                      Save
                    </Button>
                    <Button onClick={() => setShowSaveDialog(false)} variant="outline" className="h-8 text-xs">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
