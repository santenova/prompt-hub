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
import { Plus, X, Wand2, Layers, Sparkles, Zap, Info, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/apis/client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RealTimeSuggestions from "./RealTimeSuggestions";
import { Switch } from "@/components/ui/switch";
import PromptGeneratorAI from "./PromptGeneratorAI";
import PromptEnhancer from "./PromptEnhancer";
import AutoTagSuggester from "./AutoTagSuggester";
import PlaceholderEditor from "../templates/PlaceholderEditor";

const categories = [
  "Writing", "Coding", "Business", "Creative", "Marketing", "Research", "Education",
  "Relations", "Personas", "Health & Wellness", "Finance & Investment", "Legal",
  "Productivity", "Sales", "Design", "Gaming", "Food & Cooking", "Travel & Lifestyle",
  "Career Development", "Personal Development", "Data & Analytics", "AI & Machine Learning",
  "Social Media", "E-commerce", "Other"
];

export default function AddPromptModal({ open, onOpenChange, onSave, isSaving, prompt, allPrompts = [] }) {
  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    category: 'Other',
    subcategory: '',
    tags: [],
    persona: 'None'
  });
  const [tagInput, setTagInput] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] = React.useState(null);
  const [templateValues, setTemplateValues] = React.useState({});
  const [activeTab, setActiveTab] = React.useState('scratch');
  const [showRealTimeSuggestions, setShowRealTimeSuggestions] = React.useState(true);
  const [aiHelperTab, setAiHelperTab] = React.useState('generate');
  const [showPlaceholderEditor, setShowPlaceholderEditor] = React.useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiClient.entities.Template.list('-use_count'),
    initialData: [],
    enabled: open,
  });

  React.useEffect(() => {
    if (open) {
      if (prompt) {
        setFormData({
          id: prompt.id,
          title: prompt.title || '',
          content: prompt.content || '',
          category: prompt.category || 'Other',
          subcategory: prompt.subcategory || '',
          tags: prompt.tags || [],
          persona: prompt.persona || 'None'
        });
        setSelectedTemplate(null);
        setTemplateValues({});
        setActiveTab('scratch');
      } else {
        // Load default persona from settings
        const STORAGE_KEY = "prompt_muse_pro_settings";
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const settings = JSON.parse(saved);
            const defaultPersona = settings.preferences?.defaultPersona || 'None';
            setFormData({
              title: '',
              content: '',
              category: 'Other',
              subcategory: '',
              tags: [],
              persona: defaultPersona
            });
          } else {
            setFormData({
              title: '',
              content: '',
              category: 'Other',
              subcategory: '',
              tags: [],
              persona: 'None'
            });
          }
        } catch (error) {
          console.error("Failed to parse settings from localStorage:", error);
          setFormData({
            title: '',
            content: '',
            category: 'Other',
            subcategory: '',
            tags: [],
            persona: 'None'
          });
        }
        setSelectedTemplate(null);
        setTemplateValues({});
        setActiveTab('scratch');
      }
    }
  }, [open, prompt]);

  React.useEffect(() => {
    if (open && !prompt) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('useTemplate') === 'true') {
        const storedTemplate = sessionStorage.getItem('selectedTemplate');
        if (storedTemplate) {
          const template = JSON.parse(storedTemplate);
          handleSelectTemplate(template);
          sessionStorage.removeItem('selectedTemplate');
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [open, prompt]);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setActiveTab('template');
    
    setFormData({
      title: template.title,
      content: template.content,
      category: template.category,
      subcategory: template.subcategory || '',
      tags: template.tags || [],
      persona: template.persona || 'None'
    });

    const placeholders = template.content.match(/{([^}]+)}/g) || [];
    const initialValues = {};
    placeholders.forEach(p => {
      initialValues[p] = '';
    });
    setTemplateValues(initialValues);
  };

  const handleApplyTemplate = () => {
    let content = selectedTemplate.content;
    
    Object.entries(templateValues).forEach(([placeholder, value]) => {
      content = content.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || placeholder);
    });

    setFormData(prev => ({ ...prev, content }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.content) {
      onSave(formData);
      setFormData({ title: '', content: '', category: 'Other', subcategory: '', tags: [], persona: 'None' });
      setTagInput('');
      setSelectedTemplate(null);
      setTemplateValues({});
      setActiveTab('scratch');
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

  const handleApplyAIGenerated = (aiPromptData) => {
    setFormData(prev => ({
      ...prev,
      title: aiPromptData.title,
      content: aiPromptData.content,
      category: aiPromptData.category,
      persona: aiPromptData.persona || prev.persona,
      tags: [...new Set([...prev.tags, ...aiPromptData.tags])]
    }));
    setActiveTab('scratch');
    setAiHelperTab('live');
  };

  const handleApplyEnhancement = (enhancementData) => {
    setFormData(prev => ({
      ...prev,
      content: enhancementData.content,
      tags: [...new Set([...prev.tags, ...enhancementData.tags])]
    }));
  };

  const handleApplyLiveSuggestion = (suggestionText) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + suggestionText
    }));
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

  const uniquePlaceholders = selectedTemplate 
    ? [...new Set(selectedTemplate.content.match(/{([^}]+)}/g) || [])]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {prompt ? 'Edit Prompt' : 'Add New Prompt'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scratch">
                  <Plus className="w-4 h-4 mr-2" />
                  From Scratch
                </TabsTrigger>
                <TabsTrigger value="template" disabled={!!prompt}>
                  <Layers className="w-4 h-4 mr-2" />
                  From Template
                </TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4 mt-4">
                {!selectedTemplate ? (
                  <div className="space-y-4">
                    <Alert>
                      <Wand2 className="h-4 w-4" />
                      <AlertDescription>
                        Select a template to quickly create a new prompt with pre-filled content and placeholders.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                      {templates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Layers className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p>No templates available yet.</p>
                          <p className="text-sm mt-1">Create templates in the My Prompts page.</p>
                        </div>
                      ) : (
                        templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
                            className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{template.title}</h4>
                                {template.description && (
                                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {template.category}
                                  </Badge>
                                  {template.folder && (
                                    <Badge variant="outline" className="text-xs">
                                      {template.folder}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Wand2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert className="bg-purple-50 border-purple-200">
                      <Layers className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-900">
                        <strong>{selectedTemplate.title}</strong>
                        {selectedTemplate.description && ` - ${selectedTemplate.description}`}
                      </AlertDescription>
                    </Alert>

                    {uniquePlaceholders.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Fill in Template Values</Label>
                        {uniquePlaceholders.map((placeholder) => {
                          const label = placeholder.replace(/[{}]/g, '');
                          return (
                            <div key={placeholder} className="space-y-2">
                              <Label htmlFor={placeholder} className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {placeholder}
                                </Badge>
                                {label}
                              </Label>
                              <Input
                                id={placeholder}
                                placeholder={`Enter ${label}...`}
                                value={templateValues[placeholder] || ''}
                                onChange={(e) => setTemplateValues(prev => ({
                                  ...prev,
                                  [placeholder]: e.target.value
                                }))}
                              />
                            </div>
                          );
                        })}
                        <Button
                          type="button"
                          onClick={handleApplyTemplate}
                          variant="outline"
                          className="w-full"
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Apply Values to Template
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(null);
                          setTemplateValues({});
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Choose Different Template
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scratch" className="mt-4">
                <p className="text-sm text-gray-600">Create a prompt from scratch with AI assistance.</p>
              </TabsContent>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Prompt Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Blog Post Generator, Code Debugger..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
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
                  <Label htmlFor="persona">Persona</Label>
                  <Select
                    value={formData.persona}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, persona: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Expert Advisor">Expert Advisor</SelectItem>
                      <SelectItem value="Creative Director">Creative Director</SelectItem>
                      <SelectItem value="Technical Specialist">Technical Specialist</SelectItem>
                      <SelectItem value="Business Analyst">Business Analyst</SelectItem>
                      <SelectItem value="Marketing Strategist">Marketing Strategist</SelectItem>
                      <SelectItem value="Educator">Educator</SelectItem>
                      <SelectItem value="Life Coach">Life Coach</SelectItem>
                      <SelectItem value="Career Counselor">Career Counselor</SelectItem>
                      <SelectItem value="Healthcare Professional">Healthcare Professional</SelectItem>
                      <SelectItem value="Legal Advisor">Legal Advisor</SelectItem>
                      <SelectItem value="Financial Analyst">Financial Analyst</SelectItem>
                      <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                      <SelectItem value="Content Creator">Content Creator</SelectItem>
                      <SelectItem value="Social Media Manager">Social Media Manager</SelectItem>
                      <SelectItem value="Product Manager">Product Manager</SelectItem>
                      <SelectItem value="UX Designer">UX Designer</SelectItem>
                      <SelectItem value="Software Architect">Software Architect</SelectItem>
                      <SelectItem value="Sales Expert">Sales Expert</SelectItem>
                      <SelectItem value="Customer Success Manager">Customer Success Manager</SelectItem>
                      <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
                      <SelectItem value="Researcher">Researcher</SelectItem>
                      <SelectItem value="Consultant">Consultant</SelectItem>
                      <SelectItem value="Project Manager">Project Manager</SelectItem>
                      <SelectItem value="Team Leader">Team Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Prompt Content *</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="live-suggestions" className="text-xs text-gray-600 cursor-pointer">
                      Live AI
                    </Label>
                    <Switch
                      id="live-suggestions"
                      checked={showRealTimeSuggestions}
                      onCheckedChange={setShowRealTimeSuggestions}
                    />
                  </div>
                </div>
                <Textarea
                  id="content"
                  placeholder="Write your AI prompt here... Be detailed and specific for best results."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  required
                  className="min-h-[200px] text-base leading-relaxed"
                />
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
                  disabled={!formData.title || !formData.content || isSaving}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isSaving ? 'Saving...' : 'Save Prompt'}
                </Button>
              </DialogFooter>
            </form>
          </div>

          {/* Right Column - AI Helpers */}
          <div className="space-y-4">
            <Tabs value={aiHelperTab} onValueChange={setAiHelperTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="generate">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate
                </TabsTrigger>
                <TabsTrigger value="enhance" disabled={!formData.content}>
                  <Zap className="w-4 h-4 mr-2" />
                  Enhance
                </TabsTrigger>
                <TabsTrigger value="live">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Live
                </TabsTrigger>
                <TabsTrigger value="tags">
                  <Plus className="w-4 h-4 mr-2" />
                  Tags
                </TabsTrigger>
                <TabsTrigger value="placeholders" disabled={!selectedTemplate}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Fields
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="mt-4">
                <PromptGeneratorAI
                  onApplyPrompt={handleApplyAIGenerated}
                  existingPrompts={allPrompts}
                />
              </TabsContent>

              <TabsContent value="enhance" className="mt-4">
                {formData.content ? (
                  <PromptEnhancer
                    prompt={formData}
                    allPrompts={allPrompts}
                    onApplyEnhancement={handleApplyEnhancement}
                  />
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Write some prompt content first to enable enhancement.
                    </AlertDescription>
                  </Alert>
                )}
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

              <TabsContent value="tags" className="mt-4">
                <AutoTagSuggester
                  content={formData.content}
                  title={formData.title}
                  category={formData.category}
                  currentTags={formData.tags}
                  onApplyTags={handleApplySuggestedTags}
                />
              </TabsContent>

              <TabsContent value="placeholders" className="mt-4">
                {selectedTemplate ? (
                  <PlaceholderEditor
                    template={selectedTemplate}
                    onUpdate={(updatedTemplate) => {
                      setSelectedTemplate(updatedTemplate);
                      // Re-extract placeholders
                      const placeholders = updatedTemplate.content.match(/{([^}]+)}/g) || [];
                      const initialValues = {};
                      placeholders.forEach(p => {
                        initialValues[p] = templateValues[p] || '';
                      });
                      setTemplateValues(initialValues);
                    }}
                  />
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Select a template first to edit its placeholders.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
