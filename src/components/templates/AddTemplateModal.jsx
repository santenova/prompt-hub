import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Info, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import AIPromptAnalyzer from "../prompts/AIPromptAnalyzer";
import RealTimeSuggestions from "../prompts/RealTimeSuggestions";
import AutoTagSuggester from "../prompts/AutoTagSuggester";
import AITemplateEnhancer from "./AITemplateEnhancer";
import AITemplateRefiner from "./AITemplateRefiner";
import { InlineHelp } from '../onboarding/ContextualHelp';

const categories = [
  "Writing", "Coding", "Business", "Creative", "Marketing", "Research", "Education",
  "Relations", "Personas", "Health & Wellness", "Finance & Investment", "Legal",
  "Productivity", "Sales", "Design", "Gaming", "Food & Cooking", "Travel & Lifestyle",
  "Career Development", "Personal Development", "Data & Analytics", "AI & Machine Learning",
  "Social Media", "E-commerce", "Other"
];

export default function AddTemplateModal({ open, onOpenChange, template, folders, onSave, isSaving }) {
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    content: '',
    category: 'Other',
    subcategory: '',
    folder: 'Uncategorized',
    tags: [],
    is_public: false,
  });
  const [tagInput, setTagInput] = React.useState('');
  const [newFolder, setNewFolder] = React.useState('');
  const [showNewFolder, setShowNewFolder] = React.useState(false);
  const [changeNotes, setChangeNotes] = React.useState('');
  const [showRealTimeSuggestions, setShowRealTimeSuggestions] = React.useState(true);
  const [aiHelperTab, setAiHelperTab] = React.useState('enhancer');

  React.useEffect(() => {
    if (template) {
      setFormData({
        title: template.title || '',
        description: template.description || '',
        content: template.content || '',
        category: template.category || 'Other',
        subcategory: template.subcategory || '',
        folder: template.folder || 'Uncategorized',
        tags: template.tags || [],
        is_public: template.is_public || false,
      });
      setChangeNotes('');
    } else {
      setFormData({
        title: '',
        description: '',
        content: '',
        category: 'Other',
        subcategory: '',
        folder: 'Uncategorized',
        tags: [],
        is_public: false,
      });
      setChangeNotes('');
    }
  }, [template]);

  // Listen for prefill event from AI generator
  React.useEffect(() => {
    const handlePrefill = (event) => {
      const aiData = event.detail;
      if (aiData && open) {
        setFormData({
          title: aiData.title || '',
          content: aiData.content || '',
          description: aiData.description || '',
          category: aiData.category || 'Other',
          subcategory: aiData.subcategory || '',
          tags: aiData.tags || [],
          // placeholders are derived from content, not a direct state field to set
          folder: aiData.folder || '', // Set to empty string if not provided, as per outline structure
          is_public: aiData.visibility === 'public' // Map 'visibility' from event to 'is_public' state
        });
      }
    };

    window.addEventListener('prefillTemplate', handlePrefill);
    return () => window.removeEventListener('prefillTemplate', handlePrefill);
  }, [open]);

  // Filter out empty folders and ensure we always have valid options
  const validFolders = React.useMemo(() => {
    const filtered = folders.filter(f => f && f.trim() !== '');
    // Ensure 'Uncategorized' is always present and sort alphabetically
    const uniqueFolders = new Set(['Uncategorized', ...filtered]);
    return Array.from(uniqueFolders).sort();
  }, [folders]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.content) {
      const placeholderMatches = formData.content.match(/{([^}]+)}/g) || [];
      const placeholders = [...new Set(placeholderMatches)].map(p => ({
        key: p,
        label: p.replace(/[{}]/g, ''),
        description: '',
        default: ''
      }));

      const dataToSave = {
        ...formData,
        placeholders,
      };

      onSave(dataToSave);
      setFormData({
        title: '',
        description: '',
        content: '',
        category: 'Other',
        subcategory: '',
        folder: 'Uncategorized',
        tags: [],
        is_public: false,
      });
      setTagInput('');
      setChangeNotes('');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleAddFolder = () => {
    if (newFolder.trim()) {
      setFormData(prev => ({ ...prev, folder: newFolder.trim() }));
      setNewFolder('');
      setShowNewFolder(false);
    }
  };

  const handleApplyEnhancements = (enhancements) => {
    if (enhancements.description) {
      setFormData(prev => ({ ...prev, description: enhancements.description }));
    }
    if (enhancements.category) {
      setFormData(prev => ({ ...prev, category: enhancements.category }));
    }
    if (enhancements.subcategory) {
      setFormData(prev => ({ ...prev, subcategory: enhancements.subcategory }));
    }
    if (enhancements.tags) {
      setFormData(prev => ({
        ...prev,
        tags: [...new Set([...prev.tags, ...enhancements.tags])]
      }));
    }
  };

  const handleApplyRefinement = (refinementData) => {
    setFormData(prev => ({
      ...prev,
      content: refinementData.content,
      title: refinementData.title || prev.title,
      description: refinementData.description || prev.description,
      category: refinementData.category || prev.category,
      subcategory: refinementData.subcategory || prev.subcategory,
      tags: refinementData.tags ? [...new Set([...prev.tags, ...refinementData.tags])] : prev.tags
    }));
    setAiHelperTab('enhancer'); // Switch back to overview
  };

  const handleApplySuggestedTags = (tags) => {
    const newTags = tags.filter(tag => !formData.tags.includes(tag));
    if (newTags.length > 0) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, ...newTags]
      }));
    }
  };

  const handleApplyRephrase = (rephrasedContent) => {
    setFormData(prev => ({
      ...prev,
      content: rephrasedContent
    }));
  };

  const handleApplyPlaceholder = (placeholderInfo) => {
    const placeholder = placeholderInfo.placeholder;
    const currentContent = formData.content;
    
    if (!currentContent.includes(placeholder)) {
      const newContent = currentContent 
        ? `${currentContent} ${placeholder}` 
        : placeholder;
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
    }
  };

  const handleApplyLiveSuggestion = (suggestionText) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + suggestionText
    }));
  };

  const detectedPlaceholders = formData.content.match(/{([^}]+)}/g) || [];
  const uniquePlaceholders = [...new Set(detectedPlaceholders)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {template ? 'Edit Prompt' : 'Create New Prompt'}
            {template && <span className="text-sm text-gray-500 ml-2">(v{template.version || 1})</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Use curly braces to create placeholders, e.g., {'{topic}'}, {'{tone}'}, {'{length}'}. 
                  AI can suggest more placeholders for you.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="title" data-tour="title-field">Template Title *</Label>
                  <InlineHelp contentKey="templatePlaceholders" position="right" />
                </div>
                <Input
                  id="title"
                  data-tour="title-field"
                  placeholder="e.g., Blog Post Outline, Email Response Template..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of what this template does..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory (optional)</Label>
                  <Input
                    id="subcategory"
                    placeholder="e.g., SEO, Frontend, HR..."
                    value={formData.subcategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    className="text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder">Folder</Label>
                {!showNewFolder ? (
                  <div className="flex gap-2">
                    <Select
                      value={formData.folder && formData.folder.trim() !== '' ? formData.folder : "Uncategorized"}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, folder: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {validFolders.map((folder) => (
                          <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={() => setShowNewFolder(true)} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      New
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="New folder name..."
                      value={newFolder}
                      onChange={(e) => setNewFolder(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddFolder} variant="outline">
                      Add
                    </Button>
                    <Button type="button" onClick={() => setShowNewFolder(false)} variant="ghost">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="content" data-tour="content-field">Template Content *</Label>
                    <InlineHelp contentKey="templatePlaceholders" position="right" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="live-suggestions-template" className="text-xs text-gray-600 cursor-pointer">
                      Live AI
                    </Label>
                    <Switch
                      id="live-suggestions-template"
                      checked={showRealTimeSuggestions}
                      onCheckedChange={setShowRealTimeSuggestions}
                    />
                  </div>
                </div>
                <Textarea
                  id="content"
                  data-tour="content-field"
                  placeholder="Write your template here... Use {placeholder} syntax for variables, e.g., 'Write a {tone} blog post about {topic}'"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  required
                  className="min-h-[200px] text-base leading-relaxed font-mono"
                />
                {uniquePlaceholders.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs text-gray-600 font-medium">Detected placeholders:</span>
                    {uniquePlaceholders.map((placeholder, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-purple-50">
                        {placeholder}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {formData.content.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Add a tag and press Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="text-base"
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="pl-2.5 pr-1 py-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1.5 hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {template && (
                <div className="space-y-2">
                  <Label htmlFor="changeNotes">Change Notes (optional)</Label>
                  <Input
                    id="changeNotes"
                    placeholder="What did you change in this version?"
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    className="text-base"
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-tour="save-button"
                  disabled={!formData.title || !formData.content || isSaving}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isSaving ? 'Saving...' : (template ? 'Update Prompt' : 'Create Prompt')}
                </Button>
              </DialogFooter>
            </form>
          </div>

          {/* Right Column - AI Helpers */}
          <div className="space-y-4">
            <Tabs value={aiHelperTab} onValueChange={setAiHelperTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="refiner">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Refine
                </TabsTrigger>
                <TabsTrigger value="enhancer">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhance
                </TabsTrigger>
                <TabsTrigger value="live">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Live
                </TabsTrigger>
                <TabsTrigger value="analyze">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze
                </TabsTrigger>
                <TabsTrigger value="tags">
                  <Plus className="w-4 h-4 mr-2" />
                  Tags
                </TabsTrigger>
              </TabsList>

              <TabsContent value="refiner" className="mt-4">
                <AITemplateRefiner
                  template={formData}
                  onApplyRefinement={handleApplyRefinement}
                />
              </TabsContent>

              <TabsContent value="enhancer" className="mt-4">
                <AITemplateEnhancer
                  template={formData}
                  onApplyEnhancements={handleApplyEnhancements}
                />
              </TabsContent>

              <TabsContent value="live" className="mt-4">
                <RealTimeSuggestions
                  content={formData.content}
                  title={formData.title}
                  category={formData.category}
                  onApplySuggestion={handleApplyLiveSuggestion}
                  isEnabled={showRealTimeSuggestions}
                />
              </TabsContent>

              <TabsContent value="analyze" className="mt-4">
                <AIPromptAnalyzer
                  content={formData.content}
                  title={formData.title}
                  currentTags={formData.tags}
                  category={formData.category}
                  onApplyTags={handleApplySuggestedTags}
                  onApplyRephrase={handleApplyRephrase}
                  onApplyPlaceholders={handleApplyPlaceholder}
                />
              </TabsContent>

              <TabsContent value="tags" className="mt-4">
                <AutoTagSuggester
                  content={formData.content}
                  title={formData.title}
                  category={formData.category}
                  currentTags={formData.tags}
                  onApplyTags={handleApplySuggestedTags}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}